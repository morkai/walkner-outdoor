var EventEmitter = require('events').EventEmitter,
    inherits = require('util').inherits,
    functions = require('./functions');

var Transaction = module.exports = function(options)
{
  EventEmitter.call(this);
  
  this.paused = false;
  
  this.setUpOptions(options || {});
};

inherits(Transaction, EventEmitter);

Transaction.prototype.id;

Transaction.prototype.handler;

Transaction.prototype.timeout;

Transaction.prototype.interval;

Transaction.prototype.isPaused = function()
{
  return this.paused;
};

Transaction.prototype.pause = function()
{
  if (this.isPaused())
  {
    return;
  }
  
  this.paused = true;
  
  this.emit('pause');
};

Transaction.prototype.resume = function()
{
  if (!this.isPaused())
  {
    return;
  }
  
  this.paused = false;
  
  this.emit('resume');
};

/**
 * @private
 */
Transaction.prototype.setUpOptions = function(options)
{
  this.id = typeof options.id === 'string' && options.id.length
    ? options.id
    : Math.random().toString();
    
  if (options.fn in functions)
  {
    this.pdu = functions[options.fn](options);
  }
  else if (options.pdu instanceof Buffer)
  {
    this.pdu = options.pdu;
  }
  else
  {
    throw new Error(
      'Cannot set up transaction [' + this.id  + ']: no PDU specified.'
    );
  }
    
  this.timeout = typeof options.timeout === 'number' && options.timeout >= 0
    ? options.timeout
    : null;
  
  this.interval = typeof options.interval === 'number' && options.interval >= 0
    ? options.interval
    : null;
  
  this.handler = typeof options.handler === 'function'
    ? options.handler
    : function() {};
};
