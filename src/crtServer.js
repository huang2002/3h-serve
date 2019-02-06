const Logger = require('3h-log'),
    { createServer, STATUS_CODES } = require('http'),
    { join, dirname, relative, sep: PATH_SEP } = require('path'),
    { existsSync: exists, statSync: stat } = require('fs'),
    { end, respond } = require('./utils'),
    DEFAULT_TYPE_MAP = require('./typeMap');

const DEFAULT_PORT = exports.DEFAULT_PORT = 88;
const DEFAULT_DEFAULT_PAGE = exports.DEFAULT_DEFAULT_PAGE = 'index.html';
const DEFAULT_SPA_PAGE = exports.DEFAULT_SPA_PAGE = '200.html';
const DEFAULT_DEFAULT_EXT = exports.DEFAULT_DEFAULT_EXT = '.html';
const DEFAULT_FALLBACK_PAGE = exports.DEFAULT_FALLBACK_PAGE = '/404.html';
const DEFAULT_TIME_FMT = exports.DEFAULT_TIME_FMT = '[YYYY-MM-DD HH:mm:SS.sss]';
exports.DEFAULT_TYPE_MAP = DEFAULT_TYPE_MAP;

/**
 * @typedef CrtServerOptions
 * @property {boolean | undefined} start
 * @property {((req: import('http').IncomingMessage, res: import('http').ServerResponse) => false | string | void) | undefined} filter
 * @property {string | undefined} dir
 * @property {number | undefined} port
 * @property {false | string | undefined} spaPage
 * @property {false | string | undefined} defaultPage
 * @property {false | string | undefined} defaultExt
 * @property {false | RegExp | undefined} forbidden
 * @property {false | string | undefined} fallbackPage
 * @property {Map<string, string>} typeMap
 * @property {boolean | undefined} gzip
 * @property {boolean | undefined} deflate
 * @property {boolean | undefined} cache
 * @property {boolean | undefined} verbose
 * @property {boolean | undefined} debug
 * @property {string | undefined} timeFmt
 * @property {false | string | undefined} seg
 * @property {string | undefined} sep
 */

/**
 * @param {CrtServerOptions | undefined} options
 * @returns {import('http').Server}
 */
exports.crtServer = (options = {}) => {

    const CWD = process.cwd() + PATH_SEP;

    const {
        start: START = true,
        filter,
        dir: DIR = CWD,
        port: PORT = DEFAULT_PORT,
        spaPage: SPA_PAGE = DEFAULT_SPA_PAGE,
        defaultPage: DEFAULT_PAGE = DEFAULT_DEFAULT_PAGE,
        defaultExt: DEFAULT_EXT = DEFAULT_DEFAULT_EXT,
        forbidden: FORBIDDEN,
        fallbackPage: FALLBACK_PAGE = DEFAULT_FALLBACK_PAGE,
        typeMap = DEFAULT_TYPE_MAP,
        gzip: GZIP_ENABLED = true,
        deflate: DEFLATE_ENABLED = true,
        cache: CACHE = true,
        verbose: VERBOSE,
        debug: DEBUG,
        timeFmt: TIME_FMT = DEFAULT_TIME_FMT,
        seg: SEG = (DEBUG || VERBOSE) && '-'.repeat(10),
        sep: SEP = PATH_SEP
    } = options;

    const FALLBACK_PAGE_PATH = FALLBACK_PAGE && join(DIR, FALLBACK_PAGE),
        FALLBACK_PAGE_EXISTS = FALLBACK_PAGE && exists(FALLBACK_PAGE_PATH);

    const logger = new Logger({
        timeFormat: TIME_FMT
    });
    logger.setLevel(DEBUG ? 'debug' : (VERBOSE ? 'log' : 'info'));

    function logRes(code) {
        logger.log(`< ${code} ${STATUS_CODES[code]}`);
    }

    function debug(msg) {
        logger.debug('- ' + msg);
    }

    function find(path) {
        debug(`Find "${path}"`);
        return exists(path);
    }

    function resolve404(req, res) {
        if (FALLBACK_PAGE_EXISTS) {
            res.statusCode = 404;
            respond({
                path: FALLBACK_PAGE_PATH,
                req, res, typeMap,
                gzip: GZIP_ENABLED,
                deflate: DEFLATE_ENABLED,
                cache: CACHE,
                logRes
            });
        } else {
            logRes(404);
            end(res, 404);
        }
    }

    function resolve200(path, req, res) {
        respond({
            path,
            req, res, typeMap,
            gzip: GZIP_ENABLED,
            deflate: DEFLATE_ENABLED,
            cache: CACHE,
            logRes
        });
    }

    const server = createServer((req, res) => {

        const FILTER_RESULT = filter && filter(req, res);

        const { method: METHOD, url: ORIGINAL_URL } = req;

        if (SEG) {
            logger.log(SEG);
        }

        logger.log(`> ${METHOD} ${ORIGINAL_URL}`);

        if (FILTER_RESULT === false) {
            debug('Intercepted by filter');
            return;
        }

        const FILTERED_URL = typeof FILTER_RESULT === 'string' ? FILTER_RESULT : ORIGINAL_URL,
            URL = FILTERED_URL.split('?')[0];

        if (FILTERED_URL !== ORIGINAL_URL) {
            debug(`Filter: "${FILTERED_URL}"`);
        }

        if (METHOD !== 'GET' && METHOD !== 'HEAD') {
            logRes(405);
            return end(res, 405);
        }

        if (FORBIDDEN && FORBIDDEN.test(URL)) {
            logRes(403);
            return end(res, 403);
        }

        const PATH = join(DIR, URL.slice(1)),
            DEFAULT_PAGE_PATH = PATH && join(PATH, DEFAULT_PAGE);

        function routeDir(path, isDir) {

            const ENDS_WITH_SEP = path.endsWith(SEP);

            function findDefaultPage() {
                if (DEFAULT_PAGE && find(DEFAULT_PAGE_PATH)) {
                    if (ENDS_WITH_SEP) {
                        resolve200(DEFAULT_PAGE_PATH, req, res);
                    } else {
                        logRes(302);
                        res.setHeader('Location', URL + '/');
                        end(res, 302);
                    }
                    return true;
                }
            }

            if (ENDS_WITH_SEP && findDefaultPage()) {
                return;
            }

            if (!ENDS_WITH_SEP && DEFAULT_EXT) {
                const DEFAULT_EXT_PATH = (ENDS_WITH_SEP ? path.slice(0, -1) : path) + DEFAULT_EXT;
                if (find(DEFAULT_EXT_PATH)) {
                    return resolve200(DEFAULT_EXT_PATH, req, res);
                }
            }

            if (!ENDS_WITH_SEP && findDefaultPage()) {
                return;
            }

            if (SPA_PAGE) {
                const SPA_PAGE_PATH = join(isDir ? path : dirname(path), SPA_PAGE);
                if (find(SPA_PAGE_PATH)) {
                    return resolve200(SPA_PAGE_PATH, req, res);
                }
            }

            resolve404(req, res);

        }

        try {

            if (!find(PATH)) {
                if (PATH.includes('.')) {
                    resolve404(req, res);
                } else {
                    routeDir(PATH, false);
                }
            } else {
                if (stat(PATH).isFile()) {
                    resolve200(PATH, req, res);
                } else {
                    routeDir(PATH, true);
                }
            }

        } catch (err) {
            logRes(500);
            logger.error(err);
            end(res, 500);
        }

    }).on('error', err => {
        logger.error(err);
    }).on('close', () => {
        if (SEG) {
            logger.log(SEG);
        }
        logger.info('Server closed.');
    });

    if (START) {
        server.listen(PORT, () => {
            logger.info(`Server started in "${relative(CWD, DIR) || '.'}".`);
            logger.info(`( port: ${PORT}; pid: ${process.pid} )`);
        });
    }

    process.on('SIGINT', () => {
        server.close(err => {
            if (err) {
                logger.error(err);
                process.exit(1);
            } else {
                process.exit(0);
            }
        });
    });

    return server;

};
