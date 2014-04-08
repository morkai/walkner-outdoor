// Copyright (c) 2014, Łukasz Walukiewicz <lukasz@walukiewicz.eu>. Some Rights Reserved.
// Licensed under CC BY-NC-SA 4.0 <http://creativecommons.org/licenses/by-nc-sa/4.0/>.
// Part of the walkner-outdoor project <http://lukasz.walukiewicz.eu/p/walkner-outdoor>

var util = require('util');
var _ = require('underscore');
var step = require('h5.step');
var modbus = require('h5.modbus');
var Controller = require('./Controller');

const ASSUME_DISCONNECT_TIME = 2000;

const MASTER_DEFAULTS = {
  type: 'tcp',
  host: '127.0.0.1',
  port: 502,
  autoConnect: true,
  autoReconnect: true,
  timeout: 200,
  maxTimeouts: 5,
  maxRetries: 3,
  maxConcurrentRequests: 1
};

/**
 * @constructor
 * @extends Controller
 */
function ModbusTcpController(process)
{
  Controller.call(this, process);

  this.master = null;
  this.timers = {
    disconnect: null
  };
}

util.inherits(ModbusTcpController, Controller);

/**
 * @param {?Function} done
 */
ModbusTcpController.prototype.initialize = function(done)
{
  var options = _.defaults({}, this.controller.connectionInfo, MASTER_DEFAULTS);
  var master = modbus.createMaster(options);
  var controller = this;

  master.on('error', function(err)
  {
    if (err.code !== 'ECONNREFUSED')
    {
      console.error(err.message);
    }
  });

  master.on('connect', function()
  {
    clearTimeout(controller.timers.disconnect);
    controller.timers.disconnect = null;

    controller.connected();
  });

  master.on('disconnect', function()
  {
    if (!controller.timers.disconnect)
    {
      controller.timers.disconnect = setTimeout(
        function()
        {
          controller.disconnected();
        },
        ASSUME_DISCONNECT_TIME
      );
    }
  });

  this.master = master;

  done && done();
};

/**
 * @param {?Function} done
 */
ModbusTcpController.prototype.finalize = function(done)
{
  _.each(this.timers, function(timer)
  {
    clearTimeout(timer);
  });
  this.timers = null;

  this.master.removeAllListeners();
  this.master.disconnect();
  this.master = null;

  done && done();
};

/**
 * @param {Boolean} newState
 * @param {Object} controllerInfo
 * @param {?Function} done
 */
ModbusTcpController.prototype.setZoneState = function(
  newState, controllerInfo, done)
{
  this.executeTimedRequest({
    fn: 5,
    unit: controllerInfo.stateUnit,
    address: controllerInfo.stateOutput,
    value: newState ? true : false,
    handler: function(err, data)
    {
      if (done && !done.cancelled)
      {
        done(err, data);
      }
    }
  });
};

/**
 * @param {Object.<String, Boolean>} leds
 * @param {Object} controllerInfo
 * @param {?Function} done
 */
ModbusTcpController.prototype.setZoneLeds = function(leds, controllerInfo, done)
{
  var controller = this;

  step(
    function setLedsStep()
    {
      for (var led in leds)
      {
        controller.executeTimedRequest({
          fn: 5,
          unit: controllerInfo[led + 'LedUnit'],
          address: controllerInfo[led + 'LedOutput'],
          value: Controller.LED_STATE_VALUES[led][Boolean(leds[led])],
          handler: this.group()
        });
      }
    },
    function callBackStep(err)
    {
      if (done && !done.cancelled)
      {
        done(err);
      }
    }
  );
};

/**
 * @param {String} input
 * @param {Object} controllerInfo
 * @param {?Function} done
 */
ModbusTcpController.prototype.getZoneInput = function(
  input, controllerInfo, done)
{
  var controller = this;

  step(
    function getInputStep()
    {
      var next = this.next();

      controller.executeTimedRequest({
        fn: 2,
        unit: controllerInfo[input + 'Unit'],
        address: controllerInfo[input + 'Input'],
        quantity: 1,
        handler: function(err, data)
        {
          if (err)
          {
            next(err);
          }
          else
          {
            next(
              null, Controller.INPUT_STATE_VALUES[input][Boolean(data[1] & 1)]
            );
          }
        }
      });
    },
    function callBackStep(err, state)
    {
      if (done && !done.cancelled)
      {
        done(err, state);
      }
    }
  );
};

/**
 * @private
 * @param {Object} req
 */
ModbusTcpController.prototype.executeTimedRequest = function(req)
{
  var startTime = Date.now();
  var handler = req.handler || function() {};
  var controller = this;

  req.handler = function(err, data)
  {
    controller.requestTimed(Date.now() - startTime);

    handler(err, data);
  };

  this.master.executeRequest(req);
};

module.exports = ModbusTcpController;
