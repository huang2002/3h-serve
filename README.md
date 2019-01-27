# 3h-serve

> A simple but powerful server.

## Features

- Default page support
- SPA routing support
- Default extension support
- Forbidden url pattern support
- Fallback page support
- Gzip/Deflate support
- Time stamp support
- Optional routing details

## Usage

### In CLI

```bash
# Install it globally
npm install 3h-serve -g
# Show help info
3h-serve --help
```

```txt
3h-serve  [options]

    -d, --dir           <dir>     The root directory.
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

    --forbidden                   Forbidden url pattern.

    --fallback-page     <file>    The path of fallback page.
                                  Default: /404.html

    --no-fallback-page            Disable fallback pages.

    --no-gzip                     Disable gzip.

    --no-deflate                  Disable deflate.

    -v, --verbose                 Show log messages.

    --debug                       Show debug messages.
                                  (Including log messages)

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
        //   dir?: string
        //   port?: number
        //   spaPage?: false | string
        //   defaultPage?: false | string
        //   defaultExt?: false | string
        //   forbidden?: false | RegExp
        //   fallbackPage?: false | string
        //   verbose?: boolean
        //   debug?: boolean
        //   timeFmt?: string
        //   gzip?: boolean
        //   deflate?: boolean
        //   start?: boolean
        //   seg?: false | string
        //   sep?: string
    });
    ```

## Links

- [Changelog](https://github.com/huang2002/3h-serve/blob/master/CHANGELOG.md)
- [License (MIT)](https://github.com/huang2002/3h-serve/blob/master/LICENSE)
