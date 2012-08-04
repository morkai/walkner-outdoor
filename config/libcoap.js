var normalize = require('path').normalize;

/**
 * How many times to retry the command before giving up.
 */
exports.maxRetries = 1;

/**
 * Assume the connection if after the specified number of milliseconds no
 * successful request was made.
 * Timer starts after each failed request.
 */
exports.disconnectTimeout = 5000;

/**
 * Path to `coap-client` executable.
 */
exports.coapClientPath = '/home/walkner/outdoor/bin/coap-client';

/**
 * Path to directory with `one.bin` and `zero.bin` files.
 */
exports.stateFilesDir = normalize(__dirname + '/../var/libcoap');
