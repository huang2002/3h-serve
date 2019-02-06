const { createGzip, createDeflate } = require('zlib'),
    { extname, sep } = require('path'),
    { createReadStream, readFileSync: read } = require('fs'),
    { createHash } = require('crypto');

exports.toDir = dir => dir.endsWith(sep) ? dir : dir + sep;

const end = exports.end = (res, code) => {
    res.statusCode = code;
    res.end();
};

const GZIP = 'gzip';
const DEFLATE = 'deflate';

const MD5 = filePath => createHash('md5').update(read(filePath)).digest('hex');

exports.respond = ({ path, req, res, typeMap, gzip, deflate, logRes, cache }) => {

    const { headers: HEADERS } = req,
        ACCEPT_ENCODING = HEADERS['accept-encoding'] || [],
        ACCEPT_GZIP = gzip && ACCEPT_ENCODING.includes(GZIP),
        ACCEPT_DEFLATE = deflate && ACCEPT_ENCODING.includes(DEFLATE),
        ext = extname(path).slice(1);

    if (typeMap.has(ext)) {
        res.setHeader('Content-Type', typeMap.get(ext));
    }

    if (ACCEPT_GZIP) {
        res.setHeader('Content-Encoding', GZIP);
    } else if (ACCEPT_DEFLATE) {
        res.setHeader('Content-Encoding', DEFLATE);
    }

    if (cache) {

        const E_TAG = MD5(path);

        res.setHeader('Cache-Control', 'public, max-age=31536000, no-cache');
        res.setHeader('ETag', `"${E_TAG}"`);

        const IF_NONE_MATCH = HEADERS['if-none-match'];
        if (IF_NONE_MATCH && IF_NONE_MATCH.slice(1, -1) === E_TAG) {
            logRes(304);
            return end(res, 304);
        }

    }

    logRes(res.statusCode);

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
