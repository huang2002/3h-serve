#!/usr/bin/env node
const CLI = require('3h-cli'),
    { join } = require('path'),
    { serve, DEFAULT_SERVE_OPTIONS } = require('./index');

let server;

const cli = CLI.create({
    name: '3h-serve',
    title: 'A simple but powerful server.',
    nameSize: 20,
    gapSize: 10,
    lineGapSize: 1
}).first({
    name: 'root',
    help: 'Serving root\n' +
        `Default: ${DEFAULT_SERVE_OPTIONS.root}`
}).arg({
    name: 'p',
    alias: ['-port'],
    val: 'port',
    help: 'The port to listen on\n' +
        `Default: ${DEFAULT_SERVE_OPTIONS.port}`
}).arg({
    name: 'a',
    alias: ['-absolute'],
    help: 'Indicate that the root path is absolute'
}).arg({
    name: '-default-page',
    val: 'file',
    help: 'The default page to serve\n' +
        `Default: ${DEFAULT_SERVE_OPTIONS.defaultPage}`
}).arg({
    name: '-no-default-page',
    help: 'Disable default page'
}).arg({
    name: '-default-ext',
    val: 'ext',
    help: 'Default file extension\n' +
        `Default: ${DEFAULT_SERVE_OPTIONS.defaultExtension}`
}).arg({
    name: '-no-default-ext',
    help: 'Disable default file extension'
}).arg({
    name: '-spa',
    val: 'file',
    help: 'SPA home page\n' +
        `Default: ${DEFAULT_SERVE_OPTIONS.spaPage}`
}).arg({
    name: '-no-spa',
    help: 'Disable SPA routing'
}).arg({
    name: '-forbidden',
    help: 'Forbidden URL pattern'
}).arg({
    name: '-fallback-page',
    val: 'file',
    help: 'Fallback page path\n' +
        `Default: ${DEFAULT_SERVE_OPTIONS.fallbackPage}`
}).arg({
    name: '-no-fallback-page',
    help: 'Disable fallback page'
}).arg({
    name: 's',
    alias: ['-serverless'],
    help: 'Serverless file pattern'
}).arg({
    name: '-serverless-ext',
    val: 'ext',
    help: 'Default serverless file extension\n' +
        `Default: ${DEFAULT_SERVE_OPTIONS.serverlessExtension}`
}).arg({
    name: '-no-serverless-ext',
    help: 'Disable default serverless file extension'
}).arg({
    name: '-no-cache',
    help: 'Disable cache'
}).arg({
    name: '-no-zip',
    help: 'Disable zipping'
}).arg({
    name: 'l',
    alias: ['-log-level'],
    help: 'Log level\n' +
        'Options: "info"(default), "log", "debug"'
}).arg({
    name: '-silent',
    help: 'Disable log'
}).arg({
    name: '-time-format',
    help: 'Time format\n' +
        `Default: ${DEFAULT_SERVE_OPTIONS.timeFormat}`
}).arg({
    name: 'h',
    alias: ['-help'],
    help: 'Show help information'
}).on('exec', args => {
    if (args.has('h')) {
        return cli.help();
    }
    const pick = key => args.has(key) ? args.get(key)[0] : undefined,
        root = pick('root') || DEFAULT_SERVE_OPTIONS.root,
        absolute = args.has('a');
    if (absolute && !args.has('root')) {
        return console.error('Root path not found');
    }
    server = serve({
        root: absolute ? root : join(process.cwd(), root),
        port: pick('p'),
        defaultPage: args.has('-no-default-page') ? null : pick('-default-page'),
        defaultExtension: args.has('-no-default-ext') ? null : pick('-default-ext'),
        spaPage: args.has('-no-spa') ? null : pick('-spa'),
        forbiddenPattern: args.has('-forbidden') ? new RegExp(args.get('-forbidden')[0]) : null,
        fallbackPage: args.has('-no-fallback-page') ? null : pick('-fallback-page'),
        serverlessPattern: args.has('s') ? new RegExp(args.get('s')[0]) : null,
        serverlessExtension: args.has('-no-serverless-ext') ? null : pick('-serverless-ext'),
        cache: !args.has('-no-cache'),
        zip: !args.has('-no-zip'),
        logLevel: pick('l'),
        silent: args.has('-silent'),
        timeFormat: pick('-time-format'),
    });
}).on('extra', key => {
    console.error(`Unknown option: "${key}".`);
    process.exit(1);
}).on('error', err => {
    server.close();
    console.error(err);
    process.exit(1);
}).exec(process.argv);
