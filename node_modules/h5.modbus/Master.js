var EventEmitter = require('events').EventEmitter,
    inherits = require('util').inherits,
    Transaction = require('./Transaction'),
    functions = require('./functions');

var Master = module.exports = function(connection, transport, options)
{
  EventEmitter.call(this);
  
  this.setUpOptions(options || {});
  this.setUpConnection(connection);
  this.setUpTransport(transport);
  
  this.executingRequests = 0;
  this.requestQueue = [];
  this.transactions = {};
};

inherits(Master, EventEmitter);

Master.prototype.isConnected = function()
{
  return this.connection.isConnected();
};

Master.prototype.connect = function()
{
  this.connection.connect();
};

Master.prototype.disconnect = function()
{
  this.connection.disconnect();
};

Master.prototype.executeRequest = function(options)
{
  this.requestQueue.push(this.createRequest(options));
  
  if (this.isConnected() && this.requestQueue.length === 1)
  {
    this.executeQueuedRequests();
  }
};

Master.prototype.addTransaction = function(options)
{
  var transaction = this.createTransaction(options);
  
  this.setUpTransaction(transaction);
  this.executeTransaction(transaction);
  
  this.emit('transaction.add', transaction);
};

Master.prototype.findTransactions = function(filter)
{
  var allTransactions = this.transactions,
      matchedTransactions = [];
  
  switch (typeof filter)
  {
    case 'undefined':
      for (var id in allTransactions)
      {
        matchedTransactions.push(allTransactions[id]);
      }
      break;
    
    case 'string':
      if (filter in allTransactions)
      {
        matchedTransactions.push(allTransactions[filter]);
      }
      break;
    
    case 'function':
      for (var id in allTransactions)
      {
        var transaction = allTransactions[id];
        
        if (filter(transaction))
        {
          matchedTransactions.push(transaction);
        }
      }
      break;
    
    case 'object':
      if (Array.isArray(filter))
      {
        for (var i = 0, l = filter.length; i < l; ++i)
        {
          var transaction = allTransactions[filter[i]];
          
          if (transaction)
          {
            matchedTransactions.push(transaction);
          }
        }
      }
      break;
  }
  
  return matchedTransactions;
};

Master.prototype.removeTransactions = function(filter)
{
  var me = this;
  
  me.findTransactions(filter).forEach(function(transaction)
  {
    transaction.pause();
    
    delete me.transactions[transaction.id];
    
    me.emit('transaction.remove', transaction);
  });
};

Master.prototype.pauseTransactions = function(filter)
{
  this.findTransactions(filter).forEach(function(transaction)
  {
    transaction.pause();
  });
};

Master.prototype.resumeTransactions = function(filter)
{
  this.findTransactions(filter).forEach(function(transaction)
  {
    transaction.resume();
  });
};

/**
 * @private
 */
Master.prototype.setUpOptions = function(options)
{
  var checkNumber = function(value, min, max)
  {
    if (typeof max !== 'number')
    {
      max = Number.MAX_VALUE;
    }
    
    return typeof value === 'number' && value >= min && value <= max;
  };
  
  this.unit = checkNumber(options.unit, 0, 254) ? options.unit : 0;
  
  this.maxRetries = checkNumber(options.maxRetries, 0) ? options.maxRetries : 3;
  
  this.interval = checkNumber(options.interval, 0) ? options.interval : 0;
  
  this.maxConcurrentRequests = checkNumber(options.maxConcurrentRequests, 1)
    ? options.maxConcurrentRequests
    : Number.MAX_VALUE;
  
  for (var event in (options.listeners || {}))
  {
    this.on(event, options.listeners[event]);
  }
};

/**
 * @private
 */
Master.prototype.setUpConnection = function(connection)
{
  connection
    .on('connect', this.onConnect.bind(this))
    .on('error', this.emit.bind(this, 'error'))
    .on('disconnect', this.emit.bind(this, 'disconnect'));
  
  this.connection = connection;
};

/**
 * @private
 */
Master.prototype.setUpTransport = function(transport)
{
  transport.on('error', this.emit.bind(this, 'error'));
  
  this.transport = transport;
};

/**
 * @private
 */
Master.prototype.onConnect = function()
{
  this.emit('connect');
  this.executeQueuedRequests();
  this.executeRunningTransactions();
};

/**
 * @private
 */
Master.prototype.executeQueuedRequests = function()
{
  if (!this.isConnected())
  {
    return;
  }
  
  while (this.requestQueue.length > 0 &&
         this.executingRequests < this.maxConcurrentRequests)
  {
    var request = this.requestQueue.shift();
    
    this.transport.request(
      request.pdu,
      request.handler,
      request.timeout
    );
    
    this.executingRequests += 1;
  }
};

/**
 * @private
 */
Master.prototype.executeRunningTransactions = function()
{
  for (var id in this.transactions)
  {
    this.executeTransaction(this.transactions[id]);
  }
};

/**
 * @private
 */
Master.prototype.applyRequestDefaults = function(request)
{
  if (typeof request.unit !== 'number')
  {
    request.unit = this.unit;
  }
};

/**
 * @private
 */
Master.prototype.createRequest = function(options)
{
  this.applyRequestDefaults(options);
  
  var request = {
    pdu: this.createRequestPdu(options),
    timeout: options.timeout > 0 ? options.timeout : undefined,
    maxRetries: options.maxRetries >= 0 ? options.maxRetries : this.maxRetries,
    retries: 0
  };
  
  request.handler = this.createRequestHandler(request, options.handler);
  
  return request;
};

/**
 * @private
 */
Master.prototype.createRequestPdu = function(options)
{
  if (options instanceof Buffer)
  {
    return options;
  }
  
  if (options.pdu instanceof Buffer)
  {
    return options.pdu;
  }
  
  if (options.fn in functions)
  {
    return functions[options.fn](options);
  }
  
  throw new Error('Cannot execute request: no PDU specified.');
};

/**
 * @private
 */
Master.prototype.createRequestHandler = function(request, userHandler)
{
  var me = this;
  
  return function(err, data)
  {
    me.executingRequests -= 1;
    me.executeQueuedRequests();
    
    if (err && ++request.retries <= request.maxRetries)
    {
      me.requestQueue.unshift(request);
    }
    else if (typeof userHandler === 'function')
    {
      userHandler(err, data);
    }
  };
};

/**
 * @private
 */
Master.prototype.createTransaction = function(options)
{
  this.applyRequestDefaults(options);
  
  return options instanceof Transaction ? options : new Transaction(options);
};

/**
 * @private
 */
Master.prototype.setUpTransaction = function(transaction)
{
  var me = this,
      onPause = function()
      {
        me.emit('transaction.pause', this);
      },
      onResume = function()
      {
        me.emit('transaction.resume', this);
        me.executeTransaction(this);
      };
  
  transaction
    .on('pause', onPause)
    .on('resume', onResume);
  
  me.once('transaction.remove', function(removedTransaction)
  {
    if (removedTransaction === transaction)
    {
      return;
    }
    
    transaction.removeListener('pause', onPause);
    transaction.removeListener('resume', onResume);
  });
  
  me.transactions[transaction.id] = transaction;
};

Master.prototype.executeTransaction = function(transaction)
{
  var me = this;
  
  if (!me.isConnected() || transaction.isPaused())
  {
    return;
  }
  
  me.requestQueue.push({
    pdu: transaction.pdu,
    timeout: transaction.timeout,
    handler: function(err, data)
    {
      me.executingRequests -= 1;
      me.executeQueuedRequests();
      
      setTimeout(
        me.executeTransaction.bind(me, transaction),
        transaction.interval === null ? me.interval : transaction.interval
      );
      
      transaction.handler(err, data);
    }
  });
  me.executeQueuedRequests();
};
  
