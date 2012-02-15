var util = require('util');
var exec = require('child_process').exec;
var _ = require('underscore');
var step = require('step');
var Controller = require('./Controller');
var config = require('../../config/libcoap');

const PING_INTERVAL = 100;

var RESOURCE_DEFAULTS = {
  'stateResource': '/io/state',
  'greenLedResource': '/io/greenLed',
  'redLedResource': '/io/redLed',
  'stopButtonResource': '/io/stopBut'
};

/**
 * @constructor
 * @extends Controller
 */
function LibcoapController(process)
{
  Controller.call(this, process);

  this.uri = '';
  this.timers = {};
}

util.inherits(LibcoapController, Controller);

/**
 * @param {?Function} done
 */
LibcoapController.prototype.initialize = function(done)
{
  var uri = this.controller.connectionInfo.uri;

  if (uri[uri.length - 1] === '/')
  {
    uri = uri.substring(0, uri.length - 1);
  }

  this.uri = uri;

  done && done();

  this.startConnectionMonitor();
};

/**
 * @param {?Function} done
 */
LibcoapController.prototype.finalize = function(done)
{
  _.each(this.timers, function(timer)
  {
    clearTimeout(timer);
  });
  this.timers = null;

  this.uri = null;

  done && done();
};

/**
 * @param {Boolean} newState
 * @param {Object} controllerInfo
 * @param {?Function} done
 */
LibcoapController.prototype.setZoneState = function(
  newState, controllerInfo, done)
{
  var stateResource = controllerInfo.stateResource
    || RESOURCE_DEFAULTS.stateResource;

  this.setResource(stateResource, newState, function(err)
  {
    if (err)
    {
      err = "Nie udało się zmienić stanu strefy: " + err.message;
    }

    done && done(err);
  });
};

/**
 * @param {Object.<String, Boolean>} leds
 * @param {Object} controllerInfo
 * @param {?Function} done
 */
LibcoapController.prototype.setZoneLeds = function(leds, controllerInfo, done)
{
  var controller = this;

  step(
    function setGreenLedStep()
    {
      var next = this;

      if (!leds.hasOwnProperty('green'))
      {
        return next();
      }

      var greenLedResource = controllerInfo.greenLedResource
        || RESOURCE_DEFAULTS.greenLedResource;

      controller.setResource(greenLedResource, leds.green, next);
    },
    function setRedLedStep(err)
    {
      if (err)
      {
        throw "Nie udało się ustawić zielonej lampy :(";
      }

      var next = this;

      if (!leds.hasOwnProperty('red'))
      {
        return next();
      }

      var redLedResource = controllerInfo.redLedResource
        || RESOURCE_DEFAULTS.redLedResource;

      controller.setResource(redLedResource, leds.red, next);
    },
    function checkErrorStep(err)
    {
      if (err && typeof err.message === 'string')
      {
        err = "Nie udało się ustawić czerwonej lampy :(";
      }

      done && done(err);
    }
  );
};

/**
 * @param {String} input
 * @param {Object} controllerInfo
 * @param {?Function} done
 */
LibcoapController.prototype.getZoneInput = function(input, controllerInfo, done)
{
  var inputResource = controllerInfo[input + 'Resource']
    || RESOURCE_DEFAULTS[input + 'Resource'];

  if (!inputResource)
  {
    return done('Unknown input: ' + input);
  }

  this.getResource(inputResource, function(err, stdout)
  {
    if (err)
    {
      return done && done("Nie udało się odczytać wejścia: " + err.message);
    }

    var matches = stdout.match(/data:'\\x0([0-9])'/);

    if (matches)
    {
      var state = Boolean(parseInt(matches[1]));
      var value = Controller.INPUT_STATE_VALUES[input][state];

      done && done(null, value);
    }
    else
    {
      done && done("Couldn't find data in the response.");
    }
  });
};

/**
 * @private
 * @param {String} resource
 * @return {String}
 */
LibcoapController.prototype.getResourceUri = function(resource)
{
  return this.uri + (resource[0] !== '/' ? '/' : '') + resource;
};

/**
 * @private
 * @param {String} resource
 * @param {Function} done
 */
LibcoapController.prototype.getResource = function(resource, done)
{
  var cmd = config.coapClientPath + ' ' + this.getResourceUri(resource);

  this.execCmd(cmd, done, config.maxRetries);
};

/**
 * @private
 * @param {String} resource
 * @param {Boolean} state
 * @param {Function} done
 */
LibcoapController.prototype.setResource = function(resource, state, done)
{
  var stateFile = config.stateFilesDir + '/'
    + (state ? 'one' : 'zero') + '.bin';

  var cmd = config.coapClientPath + ' -m put -f ' + stateFile + ' '
    + this.getResourceUri(resource);

  this.execCmd(cmd, done, config.maxRetries);
};

/**
 * @private
 * @param {String} cmd
 * @param {?Function} done
 * @param {Number=0} [maxRetries]
 * @param {Number} [count]
 * @param {Number} [startTime]
 */
LibcoapController.prototype.execCmd = function(
  cmd, done, maxRetries, count, startTime)
{
  if (typeof maxRetries === 'undefined')
  {
    maxRetries = 0;
  }

  if (typeof count === 'undefined')
  {
    count = 0;
  }

  if (typeof startTime === 'undefined')
  {
    startTime = Date.now();
  }

  var controller = this;

  exec(cmd, function(err, stdout)
  {
    count += 1;

    if (err && count <= maxRetries)
    {
      process.nextTick(function()
      {
        controller.execCmd(cmd, done, maxRetries, count, startTime);
      });
    }
    else
    {
      controller.requestTimed(Date.now() - startTime);

      if (err)
      {
        controller.startDisconnectTimer();
      }
      else
      {
        controller.stopDisconnectTimer();
      }

      return done && done(err, stdout);
    }
  });
};

/**
 * @private
 */
LibcoapController.prototype.startConnectionMonitor = function()
{
  var controller = this;

  function ping()
  {
    var cmd = config.coapClientPath + ' ' + controller.getResourceUri('/');

    controller.execCmd(cmd, function(err)
    {
      if (err)
      {
        controller.timers.connectionMonitor = setTimeout(ping, PING_INTERVAL);
      }
      else
      {
        controller.connected();
      }
    });
  }

  ping();
};

/**
 * @private
 */
LibcoapController.prototype.startDisconnectTimer = function()
{
  if (!this.isConnected || this.timers.disconnect)
  {
    return;
  }

  var controller = this;

  this.timers.disconnect = setTimeout(
    function()
    {
      controller.disconnected();
      controller.startConnectionMonitor();
    },
    config.disconnectTimeout
  );
};

/**
 * @private
 */
LibcoapController.prototype.stopDisconnectTimer = function()
{
  if (this.timers.disconnect)
  {
    clearTimeout(this.timers.disconnect);
    delete this.timers.disconnect;
  }
}

module.exports = LibcoapController;
