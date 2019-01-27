const { createGzip, createDeflate } = require('zlib'),
    { extname } = require('path'),
    { createReadStream } = require('fs');

exports.end = (res, code) => {
    res.statusCode = code;
    res.end();
};

const GZIP = 'gzip';
const DEFLATE = 'deflate';

exports.respond = (path, req, res, typeMap, gzipEnabled, deflateEnabled) => {

    const ACCEPT_ENCODING = req.headers['accept-encoding'] || [],
        ACCEPT_GZIP = gzipEnabled && ACCEPT_ENCODING.includes(GZIP),
        ACCEPT_DEFLATE = deflateEnabled && ACCEPT_ENCODING.includes(DEFLATE),
        ext = extname(path).slice(1);

    if (typeMap.has(ext)) {
        res.setHeader('Content-Type', typeMap.get(ext));
    }

    if (ACCEPT_GZIP) {
        res.setHeader('Content-Encoding', GZIP);
    } else if (ACCEPT_DEFLATE) {
        res.setHeader('Content-Encoding', DEFLATE);
    }

    if (req.method === 'HEAD') {
        return res.end();
    }

    const src = createReadStream(path);

    if (ACCEPT_GZIP) {
        src.pipe(createGzip()).pipe(res);
    } else if (ACCEPT_DEFLATE) {
        src.pipe(createDeflate()).pipe(res);
    } else {
        src.pipe(res);
    }

};
