var normalize = require('path').normalize;

/**
 * Path to `coap-client` executable.
 */
exports.coapClientPath = '/home/walkner/ipv6/ipv6_projects/libcoap-0.1.9/examples/coap-client';

/**
 * Path to directory with `one.bin` and `zero.bin` files.
 */
exports.stateFilesDir = normalize(__dirname + '/../var/libcoap');
