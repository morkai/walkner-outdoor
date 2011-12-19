var inherits = require('util').inherits,
    SerialPort = require('serialport').SerialPort,
    defaults = require('underscore').defaults,
    Connection = require('./Connection');

var SerialConnection = module.exports = function(options)
{
  Connection.call(this);
  
  this.setUpOptions(options);
};

inherits(SerialConnection, Connection);

/**
 * @private
 */
SerialConnection.prototype.options;

/**
 * @private
 */
SerialConnection.prototype.serialPort;

/**
 * @private
 */
SerialConnection.prototype.opened;

SerialConnection.prototype.isConnected = function()
{
  return this.opened;
};

SerialConnection.prototype.connect = function()
{
  if (this.isConnected())
  {
    return;
  }
  
  this.setUpSerialPort();
  
  this.opened = true;
  
  this.emit('open');
};

SerialConnection.prototype.disconnect = function()
{
  if (!this.isConnected())
  {
    return;
  }
  
  this.serialPort.close();
  this.serialPort = null;
  
  this.opened = false;
  
  this.emit('close');
};

SerialConnection.prototype.write = function(data)
{
  if (!this.isOpen())
  {
    return;
  }
  
  this.serialPort.write(data);
};

/**
 * @private
 */
SerialConnection.prototype.setUpOptions = function(options)
{
  options || (options = {});
  
  defaults(options, {
    port: '/dev/ttyS0',
    baudRate: 19200,
    dataBits: 8,
    stopBits: 1,
    parity: 2,
    flowControl: 0
  });
  
  var baudRates = [115200, 57600, 38400, 19200, 9600, 4800, 2400, 1800, 1200,
                   600, 300, 200, 150, 134, 110, 75, 50],
      dataBits = [8, 7, 6, 5],
      stopBits = [2, 1],
      parity = [0, 1, 2],
      flowControl = [0, 1];
  
  if (baudRates.indexOf(options.baudRate) === -1)
  {
    throw new Error(
      'Invalid baud rate specified. Got [' + options.baudRate + '], ' +
      'expected one of [' + baudRates.join(', ') + '].'
    );
  }
  
  if (dataBits.indexOf(options.dataBits) === -1)
  {
    throw new Error(
      'Invalid data bits count specified. Got [' + options.dataBits + '], ' +
      'expected one of [' + dataBits.join(', ') + '].'
    );
  }
  
  if (stopBits.indexOf(options.stopBits) === -1)
  {
    throw new Error(
      'Invalid stop bits count specified. Got [' + options.stopBits + '], ' +
      'expected one of [' + stopBits.join(', ') + '].'
    );
  }
  
  if (parity.indexOf(options.parity) === -1)
  {
    throw new Error(
      'Invalid parity specified. Got [' + options.parity + '], ' +
      'expected one of [' + parity.join(', ') + '].'
    );
  }
  
  if (flowControl.indexOf(options.flowControl) === -1)
  {
    throw new Error(
      'Invalid flow control specified. Got [' + options.flowControl + '], ' +
      'expected one of [' + flowControl.join(', ') + '].'
    );
  }
  
  this.options = options;
};

/**
 * @private
 */
SerialConnection.prototype.setUpSerialPort = function()
{
  var me = this,
      serialPort = new SerialPort(this.options.port, {
        baudrate: this.options.baudRate,
        databits: this.options.dataBits,
        stopbits: this.options.stopBits,
        parity: this.options.parity,
        flowControl: this.options.flowControl
      });
  
  serialPort.on('data', function(data) { me.emit('data', data); });
  serialPort.on('error', function(err)
  {
    me.emit('error', err);
    me.close();
  });
  
  this.serialPort = serialPort;
};
