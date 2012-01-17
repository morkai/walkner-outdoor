const STATE_RESET_INTERVAL = 2000;
const RED_LED_ON_ERROR_FOR = 30000;

var _    = require('underscore');
var step = require('step');

var controller      = module.exports = {};
var messageHandlers = {};

_.extend(controller, {

  impl: {
    initialize: function(connectionInfo, done) { return done(); },
    finalize  : function(done) { return done(); },
    setState  : function(state, zone, done) { return done(); },
    setLeds   : function(leds, zone, done) { return done(); }
  },

  isRunning: false,

  zones: {},

  sendMessage: function(type, data)
  {
    process.send({
      type: type,
      data: data
    });
  },

  run: function(impl)
  {
    if (controller.isRunning)
    {
      throw new Error('Controller is already running.');
    }

    _.extend(controller.impl, impl || {});

    process.on('message', function(message)
    {
      if (message.type in messageHandlers)
      {
        messageHandlers[message.type](message.data, function(err, data)
        {
          process.send({
            id   : message.id,
            type : message.type,
            error: err ? (err.message || err) : undefined,
            data : data
          });
        });
      }
      else
      {
        console.error('Unknown message type: %s', message.type);
      }
    });

    controller.isRunning = true;
  },

  error: function(err)
  {
    for (var zoneId in controller.zones)
    {
      var zone = controller.zones[zoneId];

      if (zone.program)
      {
        finishProgram(zone, err);
      }
    }
  }

});

_.extend(messageHandlers, {

  startController: function(connectionInfo, res)
  {
    controller.impl.initialize(connectionInfo, res);
  },

  stopController: function(_, res)
  {
    controller.impl.finalize(res);
  },

  startZone: function(zone, res)
  {
    zone = _.clone(zone);

    if (zone.id in controller.zones)
    {
      return res();
    }

    controller.zones[zone.id] = _.extend(zone, {
      program: null
    });

    startStateResetTimer(zone);

    res();
  },

  stopZone: function(zoneId, res)
  {
    var zone = controller.zones[zoneId];

    if (!zone)
    {
      return res();
    }

    stopStateResetTimer(zone);

    zone = null;

    res();
  },

  startProgram: function(req, res)
  {
    var zone = controller.zones[req.zoneId];

    if (!zone)
    {
      return res('Invalid controller for the specified zone.');
    }

    if (zone.program)
    {
      return res('A program is already running on the specified zone.');
    }

    if (zone.errorTimeout)
    {
      clearTimeout(zone.errorTimeout);
      zone.errorTimeout = null;
    }

    stopStateResetTimer(zone);
    startProgram(zone, req.program, res);
  },

  stopProgram: function(zoneId, res)
  {
    var zone = controller.zones[zoneId];

    if (!zone || !zone.program)
    {
      return res();
    }

    if (zone.program.timeout)
    {
      clearTimeout(zone.program.timeout);
    }

    zone.program = null;

    startStateResetTimer(zone);

    res();
  }

});

function startStateResetTimer(zone)
{
  function resetState()
  {
    step(
      function turnOffZoneStep()
      {
        if (zone.resetStateTimer === null)
        {
          return true;
        }

        controller.impl.setState(false, zone, this);
      },
      function turnOffLedsStep()
      {
        if (zone.resetStateTimer === null)
        {
          return true;
        }

        controller.impl.setLeds({green: 0, red: 0}, zone, this);
      },
      function setTimerStep()
      {
        if (zone.resetStateTimer === null)
        {
          return true;
        }

        zone.resetStateTimer = setTimeout(resetState, STATE_RESET_INTERVAL);
      }
    );
  }

  zone.resetStateTimer = setTimeout(resetState, Math.random() * 1000);
}

function stopStateResetTimer(zone)
{
  clearTimeout(zone.resetStateTimer);

  zone.resetStateTimer = null;
}

function startProgram(zone, program, done)
{
  step(
    function setLedsStep()
    {
      controller.impl.setLeds({green: 1, red: 0}, zone, this);
    },
    function executeProgramStep(err)
    {
      if (err)
      {
        startStateResetTimer(zone);

        return this('Nie udało się ustawić lamp.');
      }

      zone.program = _.clone(program);

      executeStep(zone, 0, 0);

      return this();
    },
    done
  )
}

function executeStep(zone, stepIndex, stepIteration)
{
  if (!zone.program)
  {
    return;
  }

  var programStep = zone.program.steps[stepIndex];

  if (!programStep)
  {
    if (zone.program.infinite)
    {
      return process.nextTick(function()
      {
        executeStep(zone, 0, 0);
      });
    }

    return process.nextTick(function()
    {
      finishProgram(zone);
    });
  }

  if (programStep.iterations === stepIteration)
  {
    return process.nextTick(function()
    {
      executeStep(zone, stepIndex + 1, 0);
    });
  }

  step(
    function turnOnStep()
    {
      var next      = this;
      var startTime = Date.now();

      controller.impl.setState(true, zone, function(err)
      {
        if (err)
        {
          return next(err);
        }

        var timeOn = (programStep.timeOn * 1000) - (Date.now() - startTime);

        if (timeOn > 0)
        {
          zone.program.timeout = setTimeout(next, timeOn);
        }
        else
        {
          process.nextTick(next);
        }
      });
    },
    function turnOffStep(err)
    {
      var next = this;

      if (!zone.program)
      {
        return next();
      }

      if (err)
      {
        throw err;
      }

      var startTime = Date.now();

      controller.impl.setState(false, zone, function(err)
      {
        if (err)
        {
          return next(err);
        }

        var timeOff = (programStep.timeOff * 1000) - (Date.now() - startTime);

        if (timeOff > 0)
        {
          zone.program.timeout = setTimeout(next, timeOff);
        }
        else
        {
          process.nextTick(next);
        }
      });
    },
    function nextIterationStep(err)
    {
      if (!zone.program)
      {
        return;
      }

      if (err)
      {
        process.nextTick(function()
        {
          finishProgram(zone, err);
        });
      }
      else
      {
        process.nextTick(function()
        {
          executeStep(zone, stepIndex, stepIteration + 1);
        });
      }
    }
  );
}

function finishProgram(zone, err)
{
  controller.sendMessage('programFinished', {
    zoneId      : zone.id,
    zoneName    : zone.name,
    programName : zone.program.name,
    finishedAt  : new Date(),
    finishState : err ? 'error' : 'finish',
    errorMessage: err ? (err.message || err) : null
  });

  zone.program = null;

  if (err)
  {
    turnOnRedLed(zone);
  }
  else
  {
    startStateResetTimer(zone);
  }
}

function turnOnRedLed(zone)
{
  step(
    function setLedsStep()
    {
      controller.impl.setLeds({green: 0, red: 1}, zone, this);
    },
    function setStateStep(err)
    {
      var next = this;

      if (err)
      {
        startStateResetTimer(zone);

        return next();
      }

      zone.errorTimeout = setTimeout(
        function()
        {
          zone.errorTimeout = null;

          startStateResetTimer(zone);
        },
        RED_LED_ON_ERROR_FOR
      );


      controller.impl.setState(false, zone, this);
    }
  );
}
