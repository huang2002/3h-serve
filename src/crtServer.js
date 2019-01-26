const Logger = require('3h-log'),
    { createServer } = require('http'),
    { join, dirname, relative, sep: PATH_SEP } = require('path'),
    { existsSync: exists, statSync: stat } = require('fs'),
    { end, respond } = require('./utils');

const DEFAULT_PORT = exports.DEFAULT_PORT = 88;
const DEFAULT_DEFAULT_PAGE = exports.DEFAULT_DEFAULT_PAGE = 'index.html';
const DEFAULT_SPA_PAGE = exports.DEFAULT_SPA_PAGE = '200.html';
const DEFAULT_DEFAULT_EXT = exports.DEFAULT_DEFAULT_EXT = '.html';
const DEFAULT_TIME_FMT = exports.DEFAULT_TIME_FMT = '[YYYY-MM-DD HH:mm:SS.sss]';

/**
 * @typedef CrtServerOptions
 * @property {string | undefined} dir
 * @property {number | undefined} port
 * @property {false | string | undefined} spaPage
 * @property {false | string | undefined} defaultPage
 * @property {false | string | undefined} defaultExt
 * @property {false | RegExp | undefined} forbidden
 * @property {boolean | undefined} verbose
 * @property {boolean | undefined} debug
 * @property {string | undefined} timeFmt
 * @property {boolean | undefined} gzip
 * @property {boolean | undefined} deflate
 * @property {boolean | undefined} start
 * @property {false | string | undefined} seg
 * @property {string | undefined} sep
 */

/**
 * @param {CrtServerOptions | undefined} options
 */
exports.crtServer = (options = {}) => {

    const CWD = process.cwd();

    const {
        dir: DIR = CWD,
        port: PORT = DEFAULT_PORT,
        spaPage: SPA_PAGE = DEFAULT_SPA_PAGE,
        defaultPage: DEFAULT_PAGE = DEFAULT_DEFAULT_PAGE,
        defaultExt: DEFAULT_EXT = DEFAULT_DEFAULT_EXT,
        forbidden: FORBIDDEN,
        verbose: VERBOSE,
        timeFmt: TIME_FMT = DEFAULT_TIME_FMT,
        start: START = true,
        debug: DEBUG,
        seg: SEG = DEBUG && '-'.repeat(10),
        sep: SEP = PATH_SEP
    } = options;

    const logger = new Logger({
        timeFormat: TIME_FMT
    });
    logger.setLevel(DEBUG ? 'debug' : VERBOSE ? 'log' : 'info');

    function found(path) {
        logger.debug(`- Find "${path}"`);
        return exists(path);
    }

    function logRes(msg) {
        logger.log('< ' + msg);
    }

    const server = createServer((req, res) => {

        const { method: METHOD } = req,
            URL = req.url.split('?')[0];

        if (SEG) {
            logger.log(SEG);
        }

        logger.log(`> ${METHOD} ${URL}`);

        if (METHOD !== 'GET' || FORBIDDEN && FORBIDDEN.test(URL)) {
            logRes('403 Forbidden');
            return end(res, 403);
        }

        const PATH = join(DIR, URL.slice(1));

        function resolve(path) {
            logRes('200 OK');
            respond(path, req, res);
        }

        function routeDir(path, isDir) {

            if (DEFAULT_PAGE) {
                const DEFAULT_PAGE_PATH = join(path, DEFAULT_PAGE);
                if (found(DEFAULT_PAGE_PATH)) {
                    return resolve(DEFAULT_PAGE_PATH);
                }
            }

            if (DEFAULT_EXT) {
                const DEFAULT_EXT_PATH = (path.endsWith(SEP) ? path.slice(0, -1) : path) + DEFAULT_EXT;
                if (found(DEFAULT_EXT_PATH)) {
                    return resolve(DEFAULT_EXT_PATH);
                }
            }

            if (SPA_PAGE) {
                const SPA_PAGE_PATH = join(isDir ? path : dirname(path), SPA_PAGE);
                if (found(SPA_PAGE_PATH)) {
                    return resolve(SPA_PAGE_PATH);
                }
            }

            logRes('404 Not Found');
            end(res, 404);

        }

        try {

            if (!found(PATH)) {
                if (PATH.includes('.')) {
                    logRes('404 Not Found');
                    end(res, 404);
                } else {
                    routeDir(PATH, false);
                }
            } else {
                if (stat(PATH).isFile()) {
                    resolve(PATH);
                } else {
                    routeDir(PATH, true);
                }
            }

        } catch (err) {
            logRes('500 Internal Server Error');
            logger.error(err);
            end(res, 500);
        }

    }).on('error', err => {
        logger.error(err);
    });

    if (START) {
        server.listen(PORT, () => {
            logger.info(`Server listening on ${PORT} started in "${relative(CWD, DIR) || '.'}".`);
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
