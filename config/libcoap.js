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
exports.disconnectTimeout = 4000;

/**
 * Number of milliseconds after which the `coap-client` process will
 * be killed if it does not exit before that time.
 */
exports.coapClientTimeout = 8000;

/**
 * Path to `coap-client` executable.
 */
exports.coapClientPath = normalize(__dirname + '/../bin/coap-client-03');

/**
 * Path to directory with `one.bin` and `zero.bin` files.
 */
exports.stateFilesDir = normalize(__dirname + '/../var/libcoap');
