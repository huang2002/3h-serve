const { join } = require('path');

module.exports = (request, response, lib, options) => {
    lib.endWithFile(request, response, join(__dirname, 'secret.txt'), options);
};
