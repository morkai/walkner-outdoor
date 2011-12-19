var EventEmitter = require('events').EventEmitter,
    inherits = require('util').inherits;

var Connection = module.exports = function()
{
  EventEmitter.call(this);
};

inherits(Connection, EventEmitter);

/**
 * @return {boolean}
 */
Connection.prototype.isConnected;

Connection.prototype.connect;

Connection.prototype.disconnect;

/**
 * @param {node.Buffer} data
 */
Connection.prototype.write;
