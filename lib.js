// @ts-check
const { join, dirname, extname, sep } = require('path'),
    { existsSync, statSync, createReadStream, readFileSync } = require('fs'),
    { createGzip, createDeflate, createBrotliCompress } = require('zlib'),
    { createHash } = require('crypto'),
    { STATUS_CODES } = require('http');

/**
 * @param {import('3h-log') | null} logger
 * @param {string} path
 */
function debugFind(logger, path) {
    if (logger) {
        logger.debug('Find ' + path);
    }
}

const lib = {

    /** @type {<T>(defaults: T, options: Partial<T>) => T} */
    merge(defaults, options) {
        const result = Object.create(null);
        Object.keys(defaults).forEach(key => {
            result[key] = options[key] === undefined ? defaults[key] : options[key];
        });
        return result;
    },

    /** @param {string} path */
    isFile(path) {
        return statSync(path).isFile();
    },

    /**
     * @typedef RouteOptions
     * @property {string | null} spaPage
     * @property {string | null} defaultPage
     * @property {string | null} defaultExtension
     * @property {boolean} acceptServerless
     * @property {string | null} serverlessExtension
     * @property {import('3h-log') | null} logger
     */

    /**
     * @typedef RoutingResult
     * @property {string} path
     * @property {boolean} serverless
     */

    /**
     * @param {string} path
     * @param {RouteOptions} options
     * @returns {RoutingResult | null}
     */
    route(path, options) {
        const defaultPagePath = typeof options.defaultPage === 'string' &&
            join(path, options.defaultPage),
            pathEndsWithSep = path.endsWith(sep);
        debugFind(options.logger, path);
        const pathExists = existsSync(path);
        if (pathExists) {
            if (lib.isFile(path)) {
                return { path, serverless: options.acceptServerless };
            }
            if (pathEndsWithSep && defaultPagePath) {
                debugFind(options.logger, defaultPagePath);
                if (existsSync(defaultPagePath)) {
                    return { path: defaultPagePath, serverless: false };
                }
            }
        }
        if (options.acceptServerless && typeof options.serverlessExtension === 'string') {
            const serverlessPath = (pathEndsWithSep ? path.slice(0, -1) : path) +
                options.serverlessExtension;
            debugFind(options.logger, serverlessPath);
            if (existsSync(serverlessPath) && lib.isFile(serverlessPath)) {
                return { path: serverlessPath, serverless: true };
            }
        }
        if (typeof options.defaultExtension === 'string') {
            const pathWithExt = (pathEndsWithSep ? path.slice(0, -1) : path) +
                options.defaultExtension;
            debugFind(options.logger, pathWithExt);
            if (existsSync(pathWithExt) && lib.isFile(pathWithExt)) {
                return { path: pathWithExt, serverless: false };
            }
        }
        if (typeof options.spaPage === 'string') {
            const spaPagePath = join(dirname(path), options.spaPage);
            debugFind(options.logger, spaPagePath);
            if (existsSync(spaPagePath) && lib.isFile(spaPagePath)) {
                return { path: spaPagePath, serverless: false };
            }
        }
        if (!pathEndsWithSep && defaultPagePath) {
            debugFind(options.logger, defaultPagePath);
            if (existsSync(defaultPagePath)) {
                return { path: defaultPagePath, serverless: false };
            }
        }
        return null;
    },

    /**
     * @param {import('3h-log')} logger
     * @param {number} statusCode
     */
    logStatus(logger, statusCode) {
        logger.log(statusCode + ' ' + STATUS_CODES[statusCode]);
    },


    /**
     * @param {import('http').ServerResponse} response
     * @param {number} code
     * @param {import('3h-log') | null} logger
     */
    endWithCode(response, code, logger) {
        response.statusCode = code;
        response.end();
        if (logger) {
            lib.logStatus(logger, code);
        }
    },

    /**
     * @typedef EndWithFileOptions
     * @property {boolean} cache
     * @property {boolean} zip
     * @property {Map<string, string>} types
     * @property {import('3h-log') | null} logger
     */

    /**
     * @param {import('http').IncomingMessage} request
     * @param {import('http').ServerResponse} response
     * @param {string} path
     * @param {EndWithFileOptions} options
     */
    endWithFile(request, response, path, options) {

        const { headers } = request,
            ACCEPT_ENCODING = headers['accept-encoding'] || [],
            ACCEPT_BR = options.zip && ACCEPT_ENCODING.includes('br'),
            ACCEPT_GZIP = options.zip && ACCEPT_ENCODING.includes('gzip'),
            ACCEPT_DEFLATE = options.zip && ACCEPT_ENCODING.includes('deflate'),
            ext = extname(path).slice(1);

        if (options.types.has(ext)) {
            response.setHeader('Content-Type', options.types.get(ext));
        }

        if (ACCEPT_BR) {
            response.setHeader('Content-Encoding', 'br');
        } else if (ACCEPT_GZIP) {
            response.setHeader('Content-Encoding', 'gzip');
        } else if (ACCEPT_DEFLATE) {
            response.setHeader('Content-Encoding', 'deflate');
        }

        if (options.cache) {
            const E_TAG = createHash('md5').update(readFileSync(path)).digest('hex');
            response.setHeader('Cache-Control', 'public, max-age=31536000, no-cache');
            response.setHeader('ETag', `"${E_TAG}"`);
            const IF_NONE_MATCH = headers['if-none-match'];
            if (IF_NONE_MATCH && IF_NONE_MATCH.slice(1, -1) === E_TAG) {
                return lib.endWithCode(response, 304, options.logger);
            }
        }

        if (options.logger) {
            lib.logStatus(options.logger, response.statusCode);
        }

        if (request.method === 'HEAD') {
            return response.end();
        }

        const src = createReadStream(path);
        if (ACCEPT_BR) {
            src.pipe(createBrotliCompress()).pipe(response);
        } else if (ACCEPT_GZIP) {
            src.pipe(createGzip()).pipe(response);
        } else if (ACCEPT_DEFLATE) {
            src.pipe(createDeflate()).pipe(response);
        } else {
            src.pipe(response);
        }

    },

    /**
     * @typedef SolveOptions
     * @property {string} root
     * @property {boolean} cache
     * @property {boolean} zip
     * @property {Map<string, string>} types
     * @property {RegExp | null} forbiddenPattern
     * @property {RegExp | null} serverlessPattern
     * @property {string | null} serverlessExtension
     * @property {string | null} spaPage
     * @property {string | null} defaultPage
     * @property {string | null} defaultExtension
     * @property {string | null} fallbackPage
     * @property {import('3h-log') | null} logger
     */

    /**
     * @param {import('http').IncomingMessage} request
     * @param {import('http').ServerResponse} response
     * @param {string} path
     * @param {SolveOptions} options
     */
    solve(request, response, path, options) {
        const routingResult = lib.route(path, {
            acceptServerless: options.serverlessPattern && options.serverlessPattern.test(request.url),
            serverlessExtension: options.serverlessExtension,
            spaPage: options.spaPage,
            defaultPage: options.defaultPage,
            defaultExtension: options.defaultExtension,
            logger: options.logger,
        });
        if (!routingResult) {
            response.statusCode = 404;
            if (typeof options.fallbackPage === 'string') {
                const fallbackPagePath = join(options.root, options.fallbackPage);
                debugFind(options.logger, fallbackPagePath);
                if (existsSync(fallbackPagePath)) {
                    return lib.endWithFile(request, response, fallbackPagePath, {
                        types: options.types,
                        cache: options.cache,
                        zip: options.zip,
                        logger: options.logger,
                    });
                }
            }
            if (options.logger) {
                lib.logStatus(options.logger, 404);
            }
            return response.end();
        }
        if (options.forbiddenPattern && options.forbiddenPattern.test(routingResult.path)) {
            return lib.endWithCode(response, 403, options.logger);
        }
        if (routingResult.serverless) {
            if (options.logger) {
                options.logger.log('Invoking serverless function...');
            }
            require(routingResult.path)(request, response, lib, options);
        } else {
            lib.endWithFile(request, response, routingResult.path, {
                types: options.types,
                cache: options.cache,
                zip: options.zip,
                logger: options.logger,
            });
        }
    },

};

module.exports = lib;
