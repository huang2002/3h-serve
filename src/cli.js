#!/usr/bin/env node
const CLI = require('3h-cli'),
    { crtServer, DEFAULT_PORT, DEFAULT_DEFAULT_PAGE,
        DEFAULT_SPA_PAGE, DEFAULT_DEFAULT_EXT, DEFAULT_FALLBACK_PAGE,
        DEFAULT_TIME_FMT } = require('./crtServer');

const cli = CLI.create({
    name: '3h-serve',
    title: 'A simple but powerful server.',
    nameSize: 20,
    gapSize: 10,
    lineGapSize: 1
});

cli.first({
    name: 'd',
    val: 'dir',
    help: 'The root directory.\n' +
        'Default: `process.cwd()`'
}).arg({
    name: 'p',
    alias: ['-port'],
    val: 'port',
    help: 'The port to listen on.\n' +
        `Default: ${DEFAULT_PORT}`
}).arg({
    name: '-default-page',
    val: 'file',
    help: 'The name of default page.\n' +
        `Default: ${DEFAULT_DEFAULT_PAGE}`
}).arg({
    name: '-no-default-page',
    help: 'Disable default pages.'
}).arg({
    name: '-default-ext',
    val: 'file',
    help: 'Default file extension.\n' +
        `Default: ${DEFAULT_DEFAULT_EXT}`
}).arg({
    name: '-no-default-ext',
    help: 'Disable default file extensions.'
}).arg({
    name: '-spa',
    val: 'file',
    help: 'The name of SPA home page.\n' +
        `Default: ${DEFAULT_SPA_PAGE}`
}).arg({
    name: '-no-spa',
    help: 'Disable SPA routing.'
}).arg({
    name: '-forbidden',
    help: 'Forbidden URL pattern.'
}).arg({
    name: '-fallback-page',
    val: 'file',
    help: 'The path of fallback page.\n' +
        `Default: ${DEFAULT_FALLBACK_PAGE}`
}).arg({
    name: '-no-fallback-page',
    help: 'Disable fallback pages.'
}).arg({
    name: '-no-gzip',
    help: 'Disable gzip.'
}).arg({
    name: '-no-deflate',
    help: 'Disable deflate.'
}).arg({
    name: '-no-cache',
    help: 'Disable cache.'
}).arg({
    name: '-verbose',
    help: 'Show log messages.'
}).arg({
    name: '-debug',
    help: 'Show debug messages.\n' +
        '(including log messages)'
}).arg({
    name: '-time-fmt',
    help: 'Time format.\n' +
        `Default: ${DEFAULT_TIME_FMT}`
}).arg({
    name: 'h',
    alias: ['-help'],
    help: 'Show help info.'
});

let server;

cli.on('exec', args => {

    if (args.has('h')) {
        return cli.help();
    }

    const pick = key => args.has(key) ? args.get(key)[0] : undefined;

    server = crtServer({
        dir: pick('d'),
        port: pick('p'),
        defaultPage: args.has('-no-default-page') ? false : pick('-default-page'),
        defaultExt: args.has('-no-default-ext') ? false : pick('-default-ext'),
        defaultExt: args.has('-no-spa') ? false : pick('-spa'),
        forbidden: args.has('-forbidden') && new RegExp(args.get('-forbidden')[0]),
        fallbackPage: args.has('-no-fallback-page') ? false : pick('-fallback-page'),
        gzip: !args.has('-no-gzip'),
        deflate: !args.has('-no-deflate'),
        cache: !args.has('-no-cache'),
        verbose: args.has('-verbose'),
        debug: args.has('-debug'),
        timeFmt: pick('-time-fmt')
    });

}).on('extra', key => {
    console.error(`Unknown option: "${key}".`);
    process.exit(1);
}).on('error', err => {
    server.close();
    console.error(err);
});

cli.exec(process.argv);
