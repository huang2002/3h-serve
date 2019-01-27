const { createGzip, createDeflate } = require('zlib'),
    { extname } = require('path'),
    { createReadStream } = require('fs');

exports.end = (res, code) => {
    res.writeHead(code);
    res.end();
};

const GZIP = 'gzip';
const DEFLATE = 'deflate';

exports.respond = (path, req, res, typeMap, gzipEnabled, deflateEnabled) => {

    const src = createReadStream(path),
        accept = req.headers['accept-encoding'] || [],
        ext = extname(path).slice(1);

    if (typeMap.has(ext)) {
        res.setHeader('Content-Type', typeMap.get(ext));
    }

    if (gzipEnabled && accept.includes(GZIP)) {
        res.setHeader('Content-Encoding', GZIP);
        src.pipe(createGzip()).pipe(res);
    } else if (deflateEnabled && accept.includes(DEFLATE)) {
        res.setHeader('Content-Encoding', DEFLATE);
        src.pipe(createDeflate()).pipe(res);
    } else {
        src.pipe(res);
    }

};
