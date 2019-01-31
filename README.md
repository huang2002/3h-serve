# 3h-serve

> A simple but powerful server.

## TOC

- [Features](#features)
- [Usage](#usage)
- [Links](#links)

## Features

### Clean URL Support

`3h-serve` has some *Clean URL* support out of the box.

That is, `/foo` can match `/foo.html` if `/foo` is not present. (*Default Extension Matching*)

Or, if `/foo.html` is not present either, it can match `/foo/index.html`. (*Default Page Matching*)

Likewise, `/bar/` can match `/bar/index.html` or `/bar.html`. (Pathes that end with a separator will try to match default pages first.)

### SPA Routing Support

*Single-Page Application*(SPA) routing is also supported by default. When building single-page apps, you may use the *HTML5 History API* to do client-side routing and need to ensure that your URLs will reach your router. To achieve this, just add a `200.html` file into your directory and the requests will be handled properly.

For example, given a directory like this:

```txt
my-site/
+-- 200.html
+-- foo.html
`-- app.js
```

If you request `/foo`, `/foo.html` will be served as normal.

But if you request `/bar`, `/200.html` will be served because there is no `/bar.html` or `/bar/index.html`. (*SPA Page Matching*)

### Lucid Cache Control

This lib also has a good built-in cache control. Every asset is served with the following `Cache-Control` directive, and an ETag validator:

```txt
Cache-Control: public, max-age=31536000, no-cache
```

This tells browsers that they may store the asset for a year but must validate the cache before serving it. In this way, all assets will be cached but no stale asserts will be served.

### Optional Routing Details

There is also awesome routing information available. By default, only basic messages are printed in console. But you can turn on `verbose` option to get request logs and `debug` option to get routing details besides that. In addition, everything printed in console will be prefixed with a time stamp.

### Other Features

#### Gzip/Deflate support

Compression(including `gzip` & `deflate`) is enabled by default for any assert.

#### Forbidden URL pattern

Forbidden URLs can be indicated by giving a regular expression.

#### Custom fallback page

Custom fallback page is also supported. (Default: `/404.html`)

#### Custom filter

When using this package in your app, you can give a custom function to filter the requests. (See [`filter`](#about-the-filter).)

## Usage

### In CLI

```bash
# Install it globally
npm install 3h-serve -g
# Show help info
3h-serve --help
```

```txt
A simple but powerful server.

3h-serve <dir> [options]

    <dir>                         The root directory.
                                  Default: `process.cwd()`

    -p, --port          <port>    The port to listen on.
                                  Default: 88

    --default-page      <file>    The name of default page.
                                  Default: index.html

    --no-default-page             Disable default pages.

    --default-ext       <file>    Default file extension.
                                  Default: .html

    --no-default-ext              Disable default file extensions.

    --spa               <file>    The name of SPA home page.
                                  Default: 200.html

    --no-spa                      Disable SPA routing.

    --forbidden                   Forbidden URL pattern.

    --fallback-page     <file>    The path of fallback page.
                                  Default: /404.html

    --no-fallback-page            Disable fallback pages.

    --no-gzip                     Disable gzip.

    --no-deflate                  Disable deflate.

    --no-cache                    Disable cache.

    --verbose                     Show log messages.

    --debug                       Show debug messages.
                                  (including log messages)

    --time-fmt                    Time format.
                                  Default: [YYYY-MM-DD HH:mm:SS.sss]

    -h, --help                    Show help info.

```

### In your app

1. Install it as a dependency:

    ```bash
    npm i 3h-serve
    ```

2. Use it in your app:

    ```js
    // Import the server factory
    const { crtServer } = require('3h-serve');
    // Create a server
    const server = crtServer({
        // Options:
        //   start?: boolean
        //   filter?: (req, res) => false | string | void
        //   dir?: string
        //   port?: number
        //   spaPage?: false | string
        //   defaultPage?: false | string
        //   defaultExt?: false | string
        //   forbidden?: false | RegExp
        //   fallbackPage?: false | string
        //   typeMap?: Map<string, string>
        //   gzip?: boolean
        //   deflate?: boolean
        //   cache?: boolean
        //   verbose?: boolean
        //   debug?: boolean
        //   timeFmt?: string
        //   seg?: false | string
        //   sep?: string
    });
    ```

#### About the filter

If there is a `filter` function, it will be called before each request is processed and its return value will indicate what to be done next:

- If it returns `false`, `filter` takes over the request and this lib will do nothing to the request;
- If it returns a string, the request will be processed as if its URL is that string;
- Otherwise, the request will be processed as normal.

This option gives you great flexibility to handle some requests specially. Usually, you can use this to intercept and handle specific requests that may not be resolved properly by default.

For instance, POST requests will be rejected by default, but you can intercept and handle them in your `filter` function:

```js
const { crtServer } = require('3h-serve');

const server = crtServer({
    // ...
    filter: (req, res) => {
        if (req.method === 'POST' && req.url === '/signup') {
            // Process the submission here.
            handleSignup(req);
            // Don't forget to end the response!
            res.end();
            // Tell the lib that this request has been taken over.
            return false;
        }
    },
    // ...
});
```

## Links

- [Changelog](https://github.com/huang2002/3h-serve/blob/master/CHANGELOG.md)
- [License (MIT)](https://github.com/huang2002/3h-serve/blob/master/LICENSE)
