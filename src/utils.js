const { createGzip, createDeflate } = require('zlib'),
    { createReadStream } = require('fs');

exports.end = (res, code) => {
    res.writeHead(code);
    res.end();
};

const GZIP = 'gzip';
const DEFLATE = 'deflate';

exports.respond = (path, req, res) => {

    const src = createReadStream(path),
        accept = req.headers['accept-encoding'] || [];

    if (accept.includes(GZIP)) {
        res.setHeader('Content-Encoding', GZIP);
        src.pipe(createGzip()).pipe(res);
    } else if (accept.includes(DEFLATE)) {
        res.setHeader('Content-Encoding', DEFLATE);
        src.pipe(createDeflate()).pipe(res);
    } else {
        src.pipe(res);
    }

};
