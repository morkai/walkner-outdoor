/**
 * Generates a link to the Walkner Gateway based on a hostname
 * of the user. Return `null` to hide the link.
 *
 * @param {String} hostname
 * @return {String|null}
 */
exports.gatewayUrl = function(hostname)
{
  if (hostname.indexOf('161.') === 0)
  {
    return 'http://161.87.64.20:8085/'
  }

  if (hostname === 'localhost' || hostname.indexOf('192.') === 0)
  {
    return 'http://192.168.21.10:8085/';
  }

  return null;
};

/**
 * A list of touch enablers, i.e. objects specifying values that
 * when matched against client's values will result in that client
 * having UI with touch features enabled.
 *
 * @type {Array.<Object>}
 */
exports.touchEnablers = [

  {type: 'hostname', value: 'localhost'},
  {type: 'hostname', value: '127.0.0.1'},
  {type: 'ip', value: '192.168.21.58'},
  {type: 'ip', value: '192.168.21.59'},
  {type: 'ip', value: '192.168.21.66'}

];
