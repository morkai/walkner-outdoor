const BLINK_FREQUENCY = 1000;

const INPUT_MONITOR_INTERVAL = 100;

var util = require('util');
var step = require('step');
var zoneStates = require('./zoneStates');

/**
 * @constructor
 */
function Zone(controller, zone)
{
  this.controller = controller;
  this.zone = zone;
  this.program = null;
  this.currentState = 'disconnected';
  this.inputs = {stopButton: -1};
  this.timers = {};
  this.inputChangeListener = null;
  this.doesNeedReset = false;
}

/**
 * @param {Function} done
 */
Zone.prototype.initialize = function(done)
{
  this.changeState(
    this.controller.isConnected ? 'connected' : 'disconnected', null, done
  );
};

/**
 * @param {?String} stopReason
 * @param {Function} done
 */
Zone.prototype.finalize = function(stopReason, done)
{
  for (var timer in this.timers)
  {
    clearTimeout(this.timers[timer]);
    delete this.timers[timer];
  }

  this.changeState('stopped', {stopReason: stopReason}, done);
};

/**
 * @param {Object} data
 * @param {Function} done
 */
Zone.prototype.startProgram = function(data, done)
{
  var options = {
    manual: data.user ? true : false,
    program: data.program
  };

  this.changeState('programRunning', options, done);
};

/**
 * @param {Function} done
 */
Zone.prototype.stopProgram = function(done)
{
  if (!this.program)
  {
    return done();
  }

  this.changeState('programStopped', null, done);
};

/**
 * @param {Boolean} newState
 * @param {?Function} [done]
 */
Zone.prototype.setState = function(newState, done)
{
  return this.controller.setZoneState(newState, this.zone.controllerInfo, done);
};

/**
 * @param {String} input
 * @param {Function} [done]
 */
Zone.prototype.getInput = function(input, done)
{
  var zone = this;
  var controllerInfo = this.zone.controllerInfo;

  this.controller.getZoneInput(input, controllerInfo, function(err, newValue)
  {
    if (err)
    {
      return done(err);
    }

    var oldValue = zone.inputs[input];

    if (oldValue !== newValue)
    {
      zone.inputs[input] = newValue;

      if (zone.inputChangeListener)
      {
        zone.inputChangeListener.call(zone, input, newValue, oldValue);
      }
    }

    done && done(null, newValue);
  });
};

/**
 * @param {Boolean} newState
 * @param {?Function} [done]
 */
Zone.prototype.setLeds = function(leds, done)
{
  return this.controller.setZoneLeds(leds, this.zone.controllerInfo, done);
};

/**
 * @param {String} led
 * @param {Boolean} nextState
 * @param {String} [timer]
 * @return {Function} Cancel function.
 */
Zone.prototype.blinkLed = function(led, nextState, timer)
{
  if (typeof timer === 'undefined')
  {
    timer = Math.random().toString();

    this.timers[timer] = null;
  }

  var zone = this;
  var leds = {};

  leds[led] = nextState;

  zone.setLeds(leds, function(err)
  {
    if (!(timer in zone.timers))
    {
      return;
    }

    if (!err)
    {
      nextState = !nextState;
    }

    zone.timers[timer] = setTimeout(
      function()
      {
        if (timer in zone.timers)
        {
          zone.blinkLed(led, nextState, timer);
        }
      },
      BLINK_FREQUENCY
    );
  });

  return function()
  {
    clearTimeout(zone.timers[timer]);
    delete zone.timers[timer];
  };
};

/**
 * @param {Boolean} nextState
 * @param {String} [timer]
 * @return {Function} Cancel function.
 */
Zone.prototype.blinkLeds = function(nextState, timer)
{
  if (typeof timer === 'undefined')
  {
    timer = Math.random().toString();

    this.timers[timer] = null;
  }

  var zone = this;

  zone.setLeds({green: nextState, red: !nextState}, function(err)
  {
    if (!(timer in zone.timers))
    {
      return;
    }

    if (!err)
    {
      nextState = !nextState;
    }

    zone.timers[timer] = setTimeout(
      function()
      {
        if (timer in zone.timers)
        {
          zone.blinkLeds(nextState, timer);
        }
      },
      BLINK_FREQUENCY
    );
  });

  return function()
  {
    clearTimeout(zone.timers[timer]);
    delete zone.timers[timer];
  };
};

/**
 * Keep setting the zone state to OFF util the request succeeds or is canceled.
 *
 * @return {Function} Cancel function.
 */
Zone.prototype.turnOff = function()
{
  var cancelled = false;
  var zone = this;

  function turnOff()
  {
    zone.setState(false, function(err)
    {
      if (cancelled || !err)
      {
        return;
      }

      turnOff();
    });
  }

  turnOff();

  return function()
  {
    cancelled = true;
  };
};

Zone.prototype.startInputMonitor = function()
{
  var zone = this;

  function getStopButtonInput()
  {
    zone.getInput('stopButton', function()
    {
      zone.timers.inputMonitor = setTimeout(
        function()
        {
          if (zone.timers.inputMonitor)
          {
            getStopButtonInput();
          }
        },
        INPUT_MONITOR_INTERVAL
      );
    });
  }

  getStopButtonInput();
};

Zone.prototype.stopInputMonitor = function()
{
  this.inputChangeListener = null;

  clearTimeout(this.timers.inputMonitor);
  delete this.timers.inputMonitor;
};

/**
 * @param {String} newStateName
 * @param {?Object} options
 * @param {?Function} [done]
 */
Zone.prototype.changeState = function(newStateName, options, done)
{
  var newState = zoneStates[newStateName];

  if (!newState)
  {
    throw new Error(util.format(
      "Unknown zone state: %s", newStateName
    ));
  }

  var oldStateName = this.currentState;
  var oldState = zoneStates[oldStateName];

  if (oldState.validLeaveStates.indexOf(newStateName) === -1)
  {
    throw new Error(util.format(
      "Cannot transition from state `%s` to state `%s`.",
      oldStateName,
      newStateName
    ));
  }

  var zone = this;

  options || (options = {});

  step(
    function leaveOldStateStep()
    {
      oldState.leave.call(zone, newStateName, options, this);
    },
    function enterNewStateStep()
    {
      newState.enter.call(zone, oldStateName, options, this);
    },
    function setCurrentStateStep(err)
    {
      zone.currentState = newStateName;

      done && done(err);
    }
  );
};

/**
 * @param {?Error|?String} [error]
 */
Zone.prototype.finishProgram = function(error)
{
  if (!this.program)
  {
    return;
  }

  if (error)
  {
    this.controller.sendMessage('programErrored', {
      zoneId: this.zone._id,
      errorMessage: error.message || error
    });
  }
  else
  {
    this.controller.sendMessage('programFinished', {
      zoneId: this.zone._id
    });
  }

  this.program = null;
};

Zone.prototype.connected = function()
{
  var zone = this;

  this.changeState('connected', null, function()
  {
    zone.controller.sendMessage('connected', {
      zoneId: zone.zone._id
    })
  });
};

Zone.prototype.needsReset = function()
{
  this.doesNeedReset = true;

  this.controller.sendMessage('zoneNeedsReset', {
    zoneId: this.zone._id
  });
};

Zone.prototype.wasReset = function()
{
  this.doesNeedReset = false;

  this.controller.sendMessage('zoneWasReset', {
    zoneId: this.zone._id
  });
};

Zone.prototype.programStopped = function()
{
  var zone = this;

  this.changeState('programStopped', null, function()
  {
    zone.controller.sendMessage('programStopped', {
      zoneId: zone.zone._id
    });
  });
};

/**
 * @param {Number} remainingTime
 * @param {String} state
 * @param {Number} stepIndex
 * @param {NumbeR} stepIteration
 */
Zone.prototype.updateProgress = function(
  remainingTime, state, stepIndex, stepIteration)
{
  this.controller.sendMessage('updateProgress', {
    zoneId: this.zone._id,
    endTime: Date.now() + remainingTime * 1000,
    remainingTime: remainingTime,
    state: state,
    stepIndex: stepIndex,
    stepIteration: stepIteration
  });
};

Zone.prototype.startAssignedProgram = function()
{
  this.needsReset();

  this.controller.sendMessage('startAssignedProgram', {
    zoneId: this.zone._id
  });
};

module.exports = Zone;
