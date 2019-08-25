# 3h-serve

> A simple but powerful server.

## TOC

- [Introduction](#introduction)
- [Features](#features)
- [Command Line Usage](#command-line-usage)
- [Program Usage](#program-usage)

## Introduction

`3h-serve` is a simple but powerful server which is mainly used for testing.

You can run `npm i -g 3h-serve` to install it globally and check the help information by executing `3h-serve -h`.

## Features

### Serverless Functions

Serverless functions are supported out of the box.

For example, given a script file `/api/helloWorld.js`:

```js
module.exports = (request, response) => {
    response.end('Hello, world!');
};
```

By running `3h-serve --serverless "^/api/"` in the root directory and visitting `localhost:8080/api/helloWorld` in your browser, you should get `Hello, world!` as the result.

More specifically speaking, a function exported from a file which matches the serverless pattern given in options will be invoked to handle the request. The file defining the serverless function should be like this:

```js
/**
 * @param {import('http').IncomingMessage} request The native request object
 * @param {import('http').ServerResponse} response The native response object
 * @param {import('3h-serve').lib} lib The lib object (See `Program Usage` section)
 * @param {object} options Options passed to current handler
 */
module.exports = (request, response, lib, options) => {
    // Do something with the request and respond to it...
};
```

### SPA Home Page Routing

Routing single page applications is also supported. That is, with this feature, given a home page named `200.html`(the name can be configured) in a directory, requests to files in the directory which are not present will be responded with that page.

### Lucid Caching

`3h-serve` has a built-in cache control system. With cache enabled, all responses will have the following cache control directive and an `ETag` identifier, which tells the browsers that they can store any assets for a year but they must validate cached assets before serving them:

```txt
Cache-Control: public, max-age=31536000, no-cache
```

In this way, all assets will be cached but no stale assets will be served.

### Clean URLs

Clean URLs mean that you can visit `/baz/index.html` by requesting `/baz/index` or even `/baz`, which includes default page serving and default extension matching. (Default: `index.html` and `.html`)

### Automatic Zipping

With zipping enabled, all responses will be zipped if corresponding clients claim support of it (by using request header `Accept-Encoding`). This includes `br`, `gzip` and `deflate` zipping support.

### Custom Fallback Page

You can also customize the fallback page of your site by just simpling put a file named `404.html`(the name can be configured) in the root directory of your site.

### Debug Logging

`3h-serve` provides detailed debug logging so that you can see how requests are solved. To enable logging, set log level to `log` or `debug`. Setting it to `log` results in some brief request and response information, while setting it to `debug` will make routing processes logging also available.

## Command Line Usage

```txt
3h-serve <root> [options]

    <root>                        Serving root
                                  Default: .

    -p, --port          <port>    The port to listen on
                                  Default: 8080

    --default-page      <file>    The default page to serve
                                  Default: index.html

    --no-default-page             Disable default page

    --default-ext       <ext>     Default file extension
                                  Default: .html

    --no-default-ext              Disable default file extension

    --spa               <file>    SPA home page
                                  Default: 200.html

    --no-spa                      Disable SPA routing

    --forbidden                   Forbidden URL pattern

    --fallback-page     <file>    Fallback page path
                                  Default: 404.html

    --no-fallback-page            Disable fallback page

    -s, --serverless              Serverless file pattern

    --serverless-ext    <ext>     Default serverless file extension
                                  Default: .js

    --no-serverless-ext           Disable default serverless file extension

    --no-cache                    Disable cache

    --no-zip                      Disable zipping

    -l, --log-level               Log level
                                  Options: "info"(default), "log", "debug"

    --silent                      Disable log

    --time-format                 Time format
                                  Default: [YYYY-MM-DD HH:mm:SS.sss]

    -h, --help                    Show help information
```

## Program Usage

The exported APIs are listed here which can be accessed by installing `3h-serve` as a dependency and importing them from `3h-serve`. (Note that the `lib` object is also available as the third parameter of serverless functions.)

```ts
/**
 * @desc The default MIME type map
 */
const DEFAULT_TYPES: Map<string, string>;

/**
 * @typedef ServeOptions
 * @property {string} root The root directory (Default: .)
 * @property {number} port The port to use (Default: 8080)
 * @property {string} timeFormat Time format passing to `3h-log` (Default: [YYYY-MM-DD HH:mm:SS.sss])
 * @property {boolean} cache Whether to enable cache (Default: true)
 * @property {boolean} zip Whether to enable response zipping (Default: true)
 * @property {'info' | 'log' | 'debug'} logLevel Log level (Default: info)
 * @property {boolean} silent Whether to suppress any log (including basic info logging)
 * @property {string | null} separator The separator between logs (Default: ----------)
 * @property {Map<string, string>} types The MINE type map (Default: DEFAULT_TYPES)
 * @property {RegExp | null} forbiddenPattern Pattern of forbidden URLs (Default: null)
 * @property {RegExp | null} serverlessPattern Pattern of serverless files (Default: null)
 * @property {string | null} serverlessExtension Default extension of serverless files (Default: .js)
 * @property {string | null} spaPage SPA home page (Default: 200.html)
 * @property {string | null} defaultPage The default page to serve (Default: index.html)
 * @property {string | null} defaultExtension The default extension to match (Default: .html)
 * @property {string | null} fallbackPage Fallback page (Default: 404.html)
 */

/**
 * @desc Defaults for `serve`
 */
const DEFAULT_SERVE_OPTIONS: ServeOptions;

/**
 * @desc Create a server that acts according to given options
 */
function serve(options?: ServeOptions): Server;

/**
 * @desc The lib object provides some useful functionalities for dealing with requests
 */
namespace lib {

    /**
     * @desc Merge the defaults and options
     */
    function merge<T>(defaults: T, options: Partial<T>): T;

    /**
     * @desc Tell whether the given path is a file
     */
    function isFile(path: string): boolean;

    /**
     * @typedef RouteOptions
     * @property {string | null} spaPage SPA home page
     * @property {string | null} defaultPage The default page to serve
     * @property {string | null} defaultExtension The default extension to match
     * @property {boolean} acceptServerless Whether serverless files are acceptable
     * @property {string | null} serverlessExtension Default serverless file extension
     * @property {Logger | null} logger The logger to use
     */

    /**
     * @typedef RoutingResult
     * @property {string} path The result path
     * @property {boolean} serverless Whether the target is a serverless function
     */

    /**
     * @desc Route the given path and returns the result
     */
    function route(path: string, options: RouteOptions): RoutingResult | null;

    /**
     * @desc Log the status code and its corresponding status phrase
     */
    function logStatus(logger: Logger, statusCode: number): void;


    /**
     * @desc End the response with the given code and logs it if logger is provided
     */
    function endWithCode(response: ServerResponse, code: number, logger?: Logger | null): void;

    /**
     * @typedef EndWithFileOptions
     * @property {boolean} cache
     * @property {boolean} zip
     * @property {Map<string, string>} types
     * @property {Logger | null} logger The logger to use
     */

    /**
     * @desc End the response with the file indicated by `path`
     */
    function endWithFile(
        request: IncomingMessage,
        response: ServerResponse,
        path: string,
        options: EndWithFileOptions
    ): void;

    /**
     * @typedef SolveOptions
     * @property {string} root The root path
     * @property {boolean} cache Whether to enable cache
     * @property {boolean} zip Whether to enable zipping
     * @property {Map<string, string>} types The MIME map to use
     * @property {RegExp | null} forbiddenPattern Pattern of forbidden URLs
     * @property {RegExp | null} serverlessPattern Pattern of serverless files
     * @property {string | null} serverlessExtension Default extension of serverless files
     * @property {string | null} spaPage SPA home page
     * @property {string | null} defaultPage The default page to serve
     * @property {string | null} defaultExtension The default extension to match
     * @property {string | null} fallbackPage Fallback page
     * @property {Logger | null} logger The logger to use
     */

    /**
     * @desc Solve the request according to the given path
     */
    function solve(
        request: IncomingMessage,
        response: ServerResponse,
        path: string,
        options: SolveOptions
    ): void;

}
```
