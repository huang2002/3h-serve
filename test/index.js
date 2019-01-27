const { crtServer } = require('../src/crtServer'),
    { request } = require('http'),
    { readFileSync: read } = require('fs'),
    { join } = require('path'),
    { text } = require('3h-join');

const TEST_PORT = 8080,
    TEST_HOST = `http://localhost:${TEST_PORT}`,
    FILE_ENCODING = 'utf-8',
    AUTO = process.argv.length < 3;

const server = AUTO && crtServer({
    filter: res => res.url.endsWith('?404') ? '/not/found' : true,
    port: TEST_PORT,
    dir: __dirname,
    verbose: true,
    debug: true
});

let testCount = 0;

function assert(testPath, expectPath) {

    testCount++;

    request(TEST_HOST + testPath, res => {
        text(res, (err, actualData) => {

            if (err) {
                console.error(err);
                return process.exit(1);
            }

            console.log(`< Test "${testPath}"`);

            const expectData = read(join(__dirname, expectPath), FILE_ENCODING);
            if (actualData === expectData) {
                console.log('> passed.');
                if (--testCount) {
                    return;
                } else {
                    console.log('All tests passed!');
                }
            } else {
                console.log('> Not passed!');
                console.log('Expect:');
                console.log(expectData);
                console.log('Actual:');
                console.log(actualData);
            }

            if (AUTO) {
                server.close();
            }

        });
    }).end();

}

assert('/', '200.html');
assert('/index', '200.html');
assert('/login', '200.html');
assert('/foo.html', 'foo.html');
assert('/foo', 'foo.html');
assert('/foo/', 'foo.html');
assert('/bar', 'bar/index.html');
assert('/bar/', 'bar/index.html');
assert('/test?404', '404.html');
assert('/not/found', '404.html');
