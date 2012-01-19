require('../utils/logging');

const STOP_PROGRAMS_AFTER_CONNECTION_LOST_FOR = 5000;

var _          = require('underscore');
var step       = require('step');
var modbus     = require('h5.modbus');
var controller = require('./controller');

var master;
var stopProgramsTimeout;

controller.run({

  initialize: function(connectionInfo, done)
  {
    _.defaults(connectionInfo, {
      type                 : 'tcp',
      host                 : '127.0.0.1',
      port                 : 502,
      autoConnect          : true,
      autoReconnect        : true,
      timeout              : 200,
      maxTimeouts          : 5,
      maxRetries           : 3,
      maxConcurrentRequests: 1
    });

    master = modbus.createMaster(connectionInfo);

    master.on('error', function(err)
    {
      if (err.code !== 'ECONNREFUSED')
      {
        controller.error(err);
      }
    });

    master.on('connect', function()
    {
      if (stopProgramsTimeout)
      {
        clearTimeout(stopProgramsTimeout);
        stopProgramsTimeout = null;
      }
    });

    master.on('disconnect', function()
    {
      if (!stopProgramsTimeout)
      {
        stopProgramsTimeout = setTimeout(
          function()
          {
            stopProgramsTimeout = null;

            controller.error('Utracono połączenie ze sterownikiem.');
          },
          STOP_PROGRAMS_AFTER_CONNECTION_LOST_FOR
        );
      }
    });

    done();
  },

  finalize: function(done)
  {
    if (stopProgramsTimeout)
    {
      clearTimeout(stopProgramsTimeout);
      stopProgramsTimeout = null;
    }

    if (master)
    {
      master.removeAllListeners();
      master.disconnect();
      master = null;
    }

    done();
  },

  setState: function(state, zone, done)
  {
    master.executeRequest({
      fn     : 5,
      unit   : zone.controllerInfo.stateUnit,
      address: zone.controllerInfo.stateOutput,
      value  : state ? true : false,
      handler: done
    });
  },

  setLeds: function(leds, zone, done)
  {
    step(
      function setLedsStep()
      {
        var group = this.group();

        for (var led in leds)
        {
          master.executeRequest({
            fn     : 5,
            unit   : zone.controllerInfo[led + 'LedUnit'],
            address: zone.controllerInfo[led + 'LedOutput'],
            value  : leds[led] ? true : false,
            handler: group()
          });
        }
      },
      done
    );
  },

  getInput: function(input, zone, done)
  {
    step(
      function getInputStep()
      {
        var next = this;

        master.executeRequest({
          fn      : 2,
          unit    : zone.controllerInfo[input + 'Unit'],
          address : zone.controllerInfo[input + 'Input'],
          quantity: 1,
          handler : function(err, data)
          {
            if (err)
            {
              next(err);
            }
            else
            {
              next(null, data[1] & 1);
            }
          }
        });
      },
      done
    );
  }

});
