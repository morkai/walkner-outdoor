var net = require('net');
var util = require('util');
var _ = require('underscore');
var step = require('h5.step');
var coap = require('californium-proxy');
var codeRegistry = coap.codeRegistry;
var Controller = require('./Controller');
var RemoteController = require('./RemoteController');
var Zone = require('./Zone');
var compileProgram = require('../utils/program').compileProgram;
var config = require('../../config/cf-proxy');

var PING_INTERVAL = 400;

/**
 * @constructor
 */
function CfProxy08Controller(process)
{
  Controller.call(this, process);
  RemoteController.call(this);

  this.proxyUri = 'coap://127.0.0.1';
  this.timers = {};
  this.proxy = null;
  this.wasConnectedToProxy = false;
}

util.inherits(CfProxy08Controller, Controller);
_.extend(CfProxy08Controller.prototype, RemoteController.prototype);

/**
 * @param {?Function} done
 */
CfProxy08Controller.prototype.initialize = function(done)
{
  this.proxyUri = 'coap://';

  var connectionInfo = this.controller.connectionInfo;

  if (!_.isObject(connectionInfo)
    || !_.isString(connectionInfo.ip)
    || connectionInfo.ip.length === 0)
  {
    this.proxyUri += '127.0.0.1';
  }
  else if (connectionInfo.ip.indexOf(':') === -1)
  {
    this.proxyUri += connectionInfo.ip;
  }
  else
  {
    this.proxyUri += '[' + connectionInfo.ip + ']';
  }

  done && done();

  this.setUpProxy();
};

/**
 * @param {?Function} done
 */
CfProxy08Controller.prototype.finalize = function(done)
{
  done && done();
};

/**
 * @param {Boolean} newState
 * @param {Object} controllerInfo
 * @param {?Function} done
 */
CfProxy08Controller.prototype.setZoneState = function(newState, controllerInfo, done)
{
  var req = this.request('put', '/io/state', new Buffer([newState]));

  if (_.isFunction(done))
  {
    req.on('error', done);
  }

  req.on('response', this.checkCodeAndDone(done));
};

/**
 * @param {Object.<String, Boolean>} leds
 * @param {Object} controllerInfo
 * @param {?Function} done
 */
CfProxy08Controller.prototype.setZoneLeds = function(leds, controllerInfo, done)
{
  var controller = this;

  step(
    function setGreenLedStep()
    {
      if (!leds.hasOwnProperty('green'))
      {
        return;
      }

      var value = Controller.LED_STATE_VALUES['green'][Boolean(leds.green)];

      var req = controller.request('put', '/io/greenLed', new Buffer([value]));

      var next = this.next();

      req.on('error', next);

      req.on('response', function()
      {
        return next();
      });
    },
    function setRedLedStep(err)
    {
      if (err)
      {
        return this.done(done, "Nie udało się ustawić zielonej lampy :(");
      }

      if (!leds.hasOwnProperty('red'))
      {
        return;
      }

      var value = Controller.LED_STATE_VALUES['red'][Boolean(leds.red)];

      var req = controller.request('put', '/io/redLed', new Buffer([value]));

      var next = this.next();

      req.on('error', next);

      req.on('response', function()
      {
        return next();
      });
    },
    function checkErrorStep(err)
    {
      if (err)
      {
        err = "Nie udało się ustawić czerwonej lampy :(";
      }

      done && done(err);
    }
  );
};

/**
 * @param {Function} done
 */
CfProxy08Controller.prototype.getRemoteState = function(done)
{
  var controller = this;

  var req = this.request('get', '/state');

  req.on('error', done);

  req.on('response', function(res)
  {
    if (res.getCode() !== codeRegistry.content)
    {
      done(util.format(
        "Expected response code [%s], got [%s]",
        codeRegistry.getName(codeRegistry.content),
        codeRegistry.getName(res.getCode())
      ));
    }
    else
    {
      controller.parseRemoteState(res.getPayload(), done);
    }
  });
};

/**
 * @param {Number} remoteState
 * @param {Function} [done]
 */
CfProxy08Controller.prototype.setRemoteState = function(remoteState, done)
{
  var req = this.request('put', '/state', new Buffer([remoteState]), {
    contentType: 'application/octet-stream'
  });

  if (_.isFunction(done))
  {
    req.on('error', done);
  }

  req.on('response', this.checkCodeAndDone(done));
};

/**
 * @param {String} program
 * @param {Function} [done]
 */
CfProxy08Controller.prototype.startRemoteProgram = function(program, done)
{
  var req = this.request('put', '/start', compileProgram(program), {
    contentType: 'application/octet-stream'
  });

  if (_.isFunction(done))
  {
    req.on('error', done);
  }

  req.on('response', this.checkCodeAndDone(done));
};

/**
 * @param {Object} assignedProgram
 * @param {Function} [done]
 */
CfProxy08Controller.prototype.program = function(assignedProgram, done)
{
  var req = this.request('put', '/program', compileProgram(assignedProgram), {
    contentType: 'application/octet-stream'
  });

  if (_.isFunction(done))
  {
    req.on('error', done);
  }

  req.on('response', this.checkCodeAndDone(done));
};

/**
 * @param {Function} [done]
 */
CfProxy08Controller.prototype.stopRemoteProgram = function(done)
{
  var req = this.request('put', '/stop');

  if (_.isFunction(done))
  {
    req.on('error', done);
  }

  req.on('response', this.checkCodeAndDone(done));
};

/**
 * @private
 * @param {?Function} done
 * @return {Function}
 */
CfProxy08Controller.prototype.checkCodeAndDone = function(done)
{
  return function(res)
  {
    if (!_.isFunction(done))
    {
      return;
    }

    if (res.getCode() === codeRegistry.content)
    {
      done();
    }
    else
    {
      done(util.format(
        "Expected response code [%s], got [%s]",
        codeRegistry.getName(codeRegistry.content),
        codeRegistry.getName(res.getCode())
      ));
    }
  };
};

/**
 * @private
 */
CfProxy08Controller.prototype.setUpProxy = function()
{
  var controller = this;

  var socket = new net.Socket();
  socket.setNoDelay(true);

  socket.on('connect', function()
  {
    console.debug("[cf-proxy-08] Controller [%s] connected to the proxy", controller.controller.name);

    controller.wasConnectedToProxy = true;

    controller.startConnectionMonitor();
  });

  socket.on('error', function(err)
  {
    if (err.code !== 'ECONNREFUSED')
    {
      console.error("[cf-proxy-08] Socket error: %s", err.message);
    }
  });

  socket.on('close', function()
  {
    controller.stopDisconnectTimer();

    if (controller.wasConnectedToProxy)
    {
      console.error("[cf-proxy-08] Controller [%s] disconnected from the proxy", controller.controller.name);

      controller.wasConnectedToProxy = false;
      controller.disconnected();
    }
  });

  this.proxy = new coap.Proxy({
    socket: socket,
    reconnect: true,
    maxReconnectDelay: 2500,
    host: config.host,
    port: config.port
  });
};

/**
 * @private
 */
CfProxy08Controller.prototype.startConnectionMonitor = function()
{
  var controller = this;

  function ping()
  {
    var req = controller.request('get', '/io/devinfo');

    req.removeAllListeners();

    req.on('response', function(res)
    {
      if (res.getCode() === codeRegistry.content)
      {
        controller.connected();
      }
      else
      {
        controller.timers.connectionMonitor = setTimeout(ping, PING_INTERVAL);
      }
    });

    req.on('error', function()
    {
      controller.timers.connectionMonitor = setTimeout(ping, PING_INTERVAL);
    });
  }

  ping();
};

/**
 * @private
 */
CfProxy08Controller.prototype.startDisconnectTimer = function()
{
  if (!this.isConnected || !_.isUndefined(this.timers.disconnect))
  {
    return;
  }

  var controller = this;

  this.timers.disconnect = setTimeout(
    function()
    {
      delete controller.timers.disconnect;

      controller.disconnected();
      controller.startConnectionMonitor();
    },
    config.disconnectTimeout
  );
};

/**
 * @private
 */
CfProxy08Controller.prototype.stopDisconnectTimer = function()
{
  if (!_.isUndefined(this.timers.disconnect))
  {
    clearTimeout(this.timers.disconnect);
    delete this.timers.disconnect;
  }
};

/**
 * @private
 * @param {String} code
 * @param {String} uriPath
 * @param {Buffer=} payload
 * @param {Object=} options
 * @return {Message}
 */
CfProxy08Controller.prototype.request = function(code, uriPath, payload, options)
{
  var startTime = Date.now();

  if (!_.isObject(options))
  {
    options = {};
  }

  options.proxyUri = this.proxyUri;
  options.uriPath = uriPath;

  var req = this.proxy.request({
    type: 'con',
    code: code,
    payload: payload,
    options: options
  });

  var controller = this;

  req.on('error', function()
  {
    controller.startDisconnectTimer();
  });

  req.on('response', function(res)
  {
    controller.requestTimed(Date.now() - startTime);

    if (res.getCode() === codeRegistry.gatewayTimeout)
    {
      controller.startDisconnectTimer();
    }
    else
    {
      controller.stopDisconnectTimer();
    }
  });

  return req;
};

module.exports = CfProxy08Controller;
