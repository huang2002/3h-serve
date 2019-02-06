const { crtServer } = require('../src/crtServer'),
    { request, get } = require('http'),
    { readFileSync: read } = require('fs'),
    { join } = require('path'),
    { text } = require('3h-join');

const TEST_PORT = 8080,
    FILE_ENCODING = 'utf-8',
    AUTO = process.argv.length < 3,
    USER_CREATE_RES = read(join(__dirname, '_user_create_res.txt'));

const server = AUTO && crtServer({
    filter: ({ url }, res) => {
        if (url.endsWith('?404')) {
            return '/not/found';
        } else if (url === '/user/create') {
            res.end(USER_CREATE_RES);
            return false;
        }
    },
    port: TEST_PORT,
    dir: __dirname,
    verbose: true,
    debug: true
});

let testCount = 0;

function logTest(msg) {
    console.log(`< Test ${msg}`);
}

function logPassed() {
    console.log('> passed.');
}

function reduceTest() {
    if (--testCount) {
        return true;
    } else {
        console.log('All tests passed!');
    }
}

function logException(expect, actual) {
    console.log('> Not passed!');
    console.log('Expect:');
    console.log(expect);
    console.log('Actual:');
    console.log(actual);
}

function assertContent(path, expectPath) {

    testCount++;

    get({ port: TEST_PORT, path }, res => {
        text(res, (err, actualData) => {

            if (err) {
                console.error(err);
                return process.exit(1);
            }

            logTest(`"${path}"`);

            const expectData = read(join(__dirname, expectPath), FILE_ENCODING);
            if (actualData === expectData) {
                logPassed();
                if (reduceTest()) {
                    return;
                }
            } else {
                logException(expectData, actualData);
            }

            if (AUTO) {
                server.close();
            }

        });
    });

}

assertContent('/', '200.html');
assertContent('/index', '200.html');
assertContent('/login', '200.html');
assertContent('/foo.html', 'foo.html');
assertContent('/foo', 'foo.html');
assertContent('/foo/', 'foo/index.html');
assertContent('/test?404', '404.html');
assertContent('/not/found', '404.html');
assertContent('/user/create', '_user_create_res.txt');

function assertHeaders(path, expectHeaders) {

    testCount++;

    request({ method: 'HEAD', port: TEST_PORT, path }, res => {

        const { headers } = res;
        let passed = true;

        Object.entries(expectHeaders).forEach(([key, expectValue]) => {

            logTest(`header "${key}"`);

            const actualValue = headers[key];
            if (expectValue === actualValue) {
                logPassed();
            } else {
                passed = false;
                logException(expectValue, actualValue);
            }

        });

        if (!(passed && reduceTest()) && AUTO) {
            server.close();
        }

    }).end();

}

assertHeaders('/200.html', {
    'content-type': 'text/html'
});
assertHeaders('/index.js', {
    'content-type': 'text/javascript'
});
assertHeaders('/bar', {
    'location': '/bar/'
})
