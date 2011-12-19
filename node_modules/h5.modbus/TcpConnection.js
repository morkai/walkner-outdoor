var inherits = require('util').inherits,
    Socket = require('net').Socket,
    Connection = require('./Connection');

var TcpConnection = module.exports = function(options)
{
  Connection.call(this);
  
  var me = this;
  
  this.connecting = false;
  this.connected = false;
  this.socket = null;
  this.shouldReconnect = true;
  this.connectionAttempts = 0;
  
  this.setUpOptions(options || {});
  this.setUpReconnectHandler();
  
  if (this.autoConnect)
  {
    this.connect();
  }
};

inherits(TcpConnection, Connection);

TcpConnection.prototype.host;

TcpConnection.prototype.port;

TcpConnection.prototype.autoConnect;

TcpConnection.prototype.autoReconnect;

TcpConnection.prototype.isConnected = function()
{
  return this.connected;
};

TcpConnection.prototype.connect = function()
{
  if (this.connecting || this.isConnected())
  {
    return;
  }
  
  this.connecting = true;
  this.shouldReconnect = true;
  this.connectionAttempts += 1;
  
  this.setUpSocket();
  
  this.socket.connect(this.port, this.host);
};

TcpConnection.prototype.disconnect = function(shouldReconnect)
{
  this.shouldReconnect = shouldReconnect === true;
  
  if (this.socket)
  {
    this.socket.destroy();
  }
};

TcpConnection.prototype.write = function(data)
{
  if (!this.isConnected())
  {
    return;
  }
  
  try
  {
    this.socket.write(data);
  }
  catch (err)
  {
    this.emit('error', err);
  }
};

/**
 * @private
 */
TcpConnection.prototype.setUpOptions = function(options)
{
  this.host = typeof options.host === 'string' && options.host.length
    ? options.host
    : '127.0.0.1';

  this.port = typeof options.port === 'number' && options.port > 0
    ? options.port
    : 502;
  
  this.autoConnect =
    typeof options.autoConnect !== 'undefined' && options.autoConnect;
  
  this.autoReconnect =
    typeof options.autoReconnect === 'undefined' || options.autoReconnect;
  
  for (var event in (options.listeners || {}))
  {
    this.on(event, options.listeners[event]);
  }
};

/**
 * @private
 */
TcpConnection.prototype.setUpReconnectHandler = function()
{
  var me = this;
  
  this.on('disconnect', function()
  {
    if (me.autoReconnect && me.shouldReconnect)
    {
      setTimeout(
        me.connect.bind(me),
        me.connectionAttempts === 10 ? 500 : 50 * me.connectionAttempts
      );
    }
  });
};

/**
 * @private
 */
TcpConnection.prototype.setUpSocket = function()
{
  var me = this;
  
  if (me.socket)
  {
    me.socket.destroy();
  }

  me.socket = new Socket();
  me.socket.setNoDelay(true);
  me.socket.setKeepAlive(true);
  me.socket
    .on('connect', function()
    {
      me.connectionAttempts = 0;
      me.connecting = false;
      me.connected = true;
      
      me.emit('connect');
    })
    .on('data', function(data) { me.emit('data', data); })
    .on('error', function(err) { me.emit('error', err); })
    .on('close', function(hadError)
    {
      me.connecting = false;
      me.connected = false;
      
      me.emit('disconnect', hadError);
    });
};
