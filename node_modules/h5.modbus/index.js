exports.TcpConnection = require('./TcpConnection');
exports.TcpTransport = require('./TcpTransport');
exports.Transaction = require('./Transaction');
exports.Master = require('./Master');

var functions = require('./functions');

for (var fn in functions)
{
  exports[fn] = functions[fn];
}

exports.createMaster = function(options)
{
  var connection,
      transport;
  
  switch (options.type)
  {
    case 'tcp':
      connection = new exports.TcpConnection(options);
      transport = new exports.TcpTransport(connection, options);
      break;
    
    default:
      throw new Error('Master of type [' + options.type + '] is not supported.');
  }
  
  return new exports.Master(connection, transport, options);
};
