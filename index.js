// @ts-check
const Logger = require('3h-log'),
    { join, normalize } = require('path'),
    { createServer } = require('http'),
    lib = require('./lib'),
    DEFAULT_TYPES = require('./types');

exports.lib = lib;

exports.DEFAULT_TYPES = DEFAULT_TYPES;

/**
 * @typedef ServeOptions
 * @property {string} root
 * @property {number} port
 * @property {string} timeFormat
 * @property {boolean} cache
 * @property {boolean} zip
 * @property {'info' | 'log' | 'debug'} logLevel
 * @property {boolean} silent
 * @property {string | null} separator
 * @property {Map<string, string>} types
 * @property {RegExp | null} forbiddenPattern
 * @property {RegExp | null} serverlessPattern
 * @property {string | null} serverlessExtension
 * @property {string | null} spaPage
 * @property {string | null} defaultPage
 * @property {string | null} defaultExtension
 * @property {string | null} fallbackPage
 */

/** @type {ServeOptions} */
const DEFAULT_SERVE_OPTIONS = {
    root: '.',
    port: 8080,
    timeFormat: '[YYYY-MM-DD HH:mm:SS.sss]',
    cache: true,
    zip: true,
    logLevel: 'info',
    silent: false,
    separator: '-'.repeat(10),
    types: DEFAULT_TYPES,
    forbiddenPattern: null,
    serverlessPattern: null,
    serverlessExtension: '.js',
    spaPage: '200.html',
    defaultPage: 'index.html',
    defaultExtension: '.html',
    fallbackPage: '404.html',
};
exports.DEFAULT_SERVE_OPTIONS = DEFAULT_SERVE_OPTIONS;

/** @param {Partial<ServeOptions>} options */
exports.serve = options => {

    options = lib.merge(DEFAULT_SERVE_OPTIONS, options || Object.create(null));

    const rootPath = join(process.cwd(), options.root);

    const logger = new Logger({
        timeFormat: options.timeFormat,
    });
    logger.setLevel(options.logLevel);
    if (options.silent) {
        logger.disableAll();
    }

    const server = createServer((request, response) => {
        if (options.separator) {
            logger.log(options.separator);
        }
        logger.log(request.method + ' ' + request.url);
        const url = request.url.split('?')[0],
            path = normalize(join(rootPath, url));
        if (
            !path.startsWith(rootPath) ||
            (options.forbiddenPattern && options.forbiddenPattern.test(url))
        ) {
            return lib.endWithCode(response, 403, logger);
        }
        try {
            lib.solve(request, response, path, {
                root: rootPath,
                cache: options.cache,
                zip: options.zip,
                types: options.types,
                spaPage: options.spaPage,
                defaultPage: options.defaultPage,
                defaultExtension: options.defaultExtension,
                forbiddenPattern: options.forbiddenPattern,
                serverlessPattern: options.serverlessPattern,
                serverlessExtension: options.serverlessExtension,
                fallbackPage: options.fallbackPage,
                logger,
            });
        } catch (error) {
            logger.error(error);
            if (!response.finished) {
                lib.endWithCode(response, 500, logger);
            }
        }
    }).on('error', error => {
        logger.error(String(error));
        process.exit(1);
    }).on('close', () => {
        if (options.separator) {
            logger.log(options.separator);
        }
        logger.info('Server closed');
    });

    process.on('SIGINT', () => {
        server.close(error => {
            if (error) {
                logger.error(String(error));
                process.exit(1);
            } else {
                process.exit(0);
            }
        });
    });

    return server.listen(options.port, () => {
        logger.info(`Server started. (port: ${options.port}; pid: ${process.pid})`);
        logger.info('Press Ctrl+C to stop the server.');
    });

};
