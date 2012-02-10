/**
 * A number of milliseconds between a reset of the zone's state (if no program
 * is running on a given zone, all of its outputs are set to 0).
 */
const STATE_RESET_INTERVAL = 5000;

/**
 * A number of milliseconds between the requests for input state.
 * Currently only stop button input is read.
 */
const INPUT_MONITOR_INTERVAL = 250;

/**
 * A number of milliseconds the red LED is turned on after the running
 * program fails.
 */
const RED_LED_ON_ERROR_FOR = 30000;

/**
 * A number of milliseconds after which the action is taken if a state
 * of the stop button changed.
 */
const STOP_BUTTON_CHANGE_TIMEOUT = 1000;

/**
 * A value representing a released state of the stop button.
 */
const STOP_BUTTON_RELEASED_VALUE = 1;

/**
 * A number of milliseconds between a broadcasting of the request times.
 */
const REQUEST_TIMES_INTERVAL = 5000;

var _    = require('underscore');
var step = require('step');

var controller      = module.exports = {};
var messageHandlers = {};

_.extend(controller, {

  impl: {
    initialize: function(connectionInfo, done) {},
    finalize  : function(done) {},
    setState  : function(state, zone, done) {},
    setLeds   : function(leds, zone, done) {},
    getInput  : function(input, zone, done) {}
  },

  isRunning: false,

  requestTimes: {
    timer: null,
    total: 0,
    count: 0,
    last : 0,
    min  : Number.MAX_VALUE,
    max  : Number.MIN_VALUE
  },

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

    process.nextTick(sendRequestTimes);
  },

  requestTimed: function(time)
  {
    var times = controller.requestTimes;

    if (times.total === Number.MAX_VALUE)
    {
      times.total = 0;
      times.count = 0;
    }

    times.total += time;
    times.count += 1;
    times.last   = time;

    if (time < times.min)
    {
      times.min = time;
    }

    if (time > times.max)
    {
      times.max = time;
    }
  },

  error: function(err)
  {
    for (var zoneId in controller.zones)
    {
      var zone = controller.zones[zoneId];

      if (zone.program)
      {
        finishProgram(zone, 'error', err);
      }
    }
  }

});

_.extend(messageHandlers, {

  startController: function(connectionInfo, res)
  {
    controller.impl.initialize(connectionInfo, res);
  },

  stopController: function(data, res)
  {
    step(
      function stopZonesStep()
      {
        if (_.size(controller.zones) === 0)
        {
          return true;
        }

        var group = this.group();

        _.each(controller.zones, function(zone)
        {
          stopZone(zone, 'Wyłączenie procesu sterownika.', group());
        });
      },
      function finalizeControllerStep()
      {
        controller.impl.finalize(this);
      },
      function cleanUpStep()
      {
        if (controller.requestTimes.timer)
        {
          clearTimeout(controller.requestTimes.timer);
        }

        for (var p in controller)
        {
          delete controller[p];
        }

        controller = null;

        return true;
      },
      res
    );
  },

  startZone: function(zone, res)
  {
    zone = _.clone(zone);

    if (zone.id in controller.zones)
    {
      return res();
    }

    controller.zones[zone.id] = _.extend(zone, {
      program          : null,
      inputs           : {stopButton: 1},
      errorTimeout     : null,
      resetStateTimer  : null,
      inputMonitorTimer: null
    });

    startStateResetTimer(zone);
    startInputMonitor(zone);

    res();

    controller.sendMessage('zoneStarted', zone.id);
  },

  stopZone: function(zoneId, res)
  {
    var zone = controller.zones[zoneId];

    if (!zone)
    {
      return res();
    }

    stopZone(zone, 'Wyłączenie strefy.', res);
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

    if (req.user && zone.inputs.stopButton !== STOP_BUTTON_RELEASED_VALUE)
    {
      return res('Przełącznik załączenia testu musi zostać przełączony :(');
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
      zone.program.timeout = null;
    }

    zone.program = null;

    startStateResetTimer(zone);

    res();
  },

  blinkRedLed: function(data)
  {
    var zone = controller.zones[data.zoneId];

    if (!zone)
    {
      return;
    }

    blinkRedLed(zone, data.time || 1);
  }

});

function stopZone(zone, programStopReason, done)
{
  if (zone.program)
  {
    finishProgram(zone, 'error', programStopReason);
  }

  stopInputMonitor(zone);
  stopStateResetTimer(zone);

  var zoneId = zone.id;

  delete controller.zones[zoneId];
  zone = null;

  controller.sendMessage('zoneStopped', zoneId);

  done();
}

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
      finishProgram(zone, 'finish');
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
          finishProgram(zone, 'error', err);
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

function finishProgram(zone, state, err)
{
  if (zone.program.timeout)
  {
    clearTimeout(zone.program.timeout);
  }

  controller.sendMessage('programFinished', {
    zoneId      : zone.id,
    zoneName    : zone.name,
    programName : zone.program.name,
    finishedAt  : new Date(),
    finishState : state,
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

function startInputMonitor(zone)
{
  function monitorInputs()
  {
    controller.impl.getInput('stopButton', zone, function(err, newValue)
    {
      if (!err)
      {
        var oldValue = zone.inputs.stopButton;

        if (newValue !== oldValue)
        {
          zone.inputs.stopButton = newValue;

          handleInputChange(zone, 'stopButton', newValue, oldValue);
        }
      }

      zone.inputMonitorTimer = setTimeout(
        monitorInputs, INPUT_MONITOR_INTERVAL
      );
    });
  }

  zone.inputMonitorTimer = setTimeout(monitorInputs, Math.random() * 1000);
}

function stopInputMonitor(zone)
{
  clearTimeout(zone.inputMonitorTimer);

  zone.inputMonitorTimer = null;
}

function handleInputChange(zone, input, newValue, oldValue)
{
  switch (input)
  {
    case 'stopButton':
      clearTimeout(zone.stopButtonTimeout);

      zone.stopButtonTimeout = setTimeout(
        function()
        {
          if (zone.inputs.stopButton === newValue)
          {
            handleStopButtonChange(zone, newValue, oldValue);
          }
        },
        STOP_BUTTON_CHANGE_TIMEOUT
      );
      break;
  }
}

function handleStopButtonChange(zone, newValue, oldValue)
{
  if (newValue === 1)
  {
    if (zone.program)
    {
      console.debug(
        'Someone requested to stop program <%s> on zone <%s>.',
        zone.program.name,
        zone.name
      );

      finishProgram(zone, 'stop');
    }
    else
    {
      console.debug(
        'Someone requested to stop program on zone <%s>, ' +
        'but there is no program running. Setting red LED for 1 second.',
        zone.name
      );

      return blinkRedLed(zone, 1);
    }
  }
  else
  {
    if (zone.program)
    {
      console.debug(
        'Someone requested to start program on zone <%s>, ' +
        'but there is one already running. Setting red LED for 1 second.',
        zone.name
      );

      return blinkRedLed(zone, 1);
    }
    else
    {
      console.debug(
        'Someone requested to start the assigned program on zone <%s>.',
        zone.name
      );

      startAssignedProgram(zone);
    }
  }
}

/**
 * Blink red LED on `zone` for `time` seconds.
 *
 * Sets the red LED on the specified zone. If no program was started on that
 * zone after the specified time, resets that red LED.
 *
 * State reset timer is stopped for the whole process.
 *
 * @param {Object} zone
 * @param {Number} time
 */
function blinkRedLed(zone, time)
{
  stopStateResetTimer(zone);

  controller.impl.setLeds({red: 1}, zone, function()
  {
    setTimeout(function()
    {
      if (zone.program)
      {
        return;
      }

      controller.impl.setLeds({red: 0}, zone, function()
      {
        if (zone.program)
        {
          return;
        }

        startStateResetTimer(zone);
      });
    }, time * 1000);
  });
}

function startAssignedProgram(zone)
{
  controller.sendMessage('startAssignedProgram', {
    zoneId: zone.id
  });
}

function sendRequestTimes()
{
  if (!controller.isRunning)
  {
    return;
  }

  var times = controller.requestTimes;

  if (times.count > 0)
  {
    controller.sendMessage('timed', {
      last: Math.ceil(times.last),
      avg : Math.ceil(times.total / times.count),
      min : Math.ceil(times.min),
      max : Math.ceil(times.max)
    });
  }

  times.timer = setTimeout(sendRequestTimes, REQUEST_TIMES_INTERVAL);
}
