var EventEmitter = require('events').EventEmitter,
    inherits = require('util').inherits;

var Transport = module.exports = function()
{
  EventEmitter.call(this);
};

inherits(Transport, EventEmitter);

/**
 * @param {node.Buffer} pdu
 * @param {Function} handler
 * @param {number} timeout
 */
Transport.prototype.request;