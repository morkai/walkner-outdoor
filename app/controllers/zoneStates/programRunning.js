var _ = require('underscore');
var step = require('step');

const PLUGGED_OFF_TIMEOUT = 2000;
const PROGRAM_STOPPED_TIMEOUT = 2000;

exports.validLeaveStates = [
  'disconnected',
  'stopped',
  'programErrored',
  'programStopped',
  'programFinished'
];

exports.enter = function(oldState, options, done)
{
  var zone = this;

  zone.program = _.clone(options.program);
  zone.program.remainingTime = zone.program.totalTime;
  zone.program.running = true;

  zone.setLeds({green: true, red: false}, function(err)
  {
    if (err)
    {
      process.nextTick(function()
      {
        zone.changeState('programErrored', {
          error: "Nie udało się ustawić lamp."
        });
      });
    }
    else
    {
      zone.inputChangeListener = onInputChange;

      executeStep(zone, 0, 0);
    }

    done(err);
  });
};

exports.leave = function(newState, options, done)
{
  this.inputChangeListener = null;

  clearTimeout(this.timers.nextProgramStep);
  delete this.timers.nextProgramStep;

  clearTimeout(this.timers.zonePluggedOff);
  delete this.timers.zonePluggedOff;

  clearTimeout(this.timers.programStopped);
  delete this.timers.programStopped;

  delete this.program.remainingTime;
  delete this.program.running;

  done();
};

/**
 * @param {String} input
 * @param {Number} newValue
 * @param {Number} oldValue
 */
function onInputChange(input, newValue, oldValue)
{
  if (input === 'stopButton')
  {
    return handleStopButtonChange(this, newValue, oldValue);
  }

  if (input === 'connected')
  {
    return handleConnectedChange(this, newValue, oldValue);
  }
}

/**
 * @param {Zone} zone
 * @param {Number} newValue
 * @param {Number} oldValue
 */
function handleStopButtonChange(zone, newValue, oldValue)
{
  var timers = zone.timers;

  // If the stop button is pressed (newValue=1)
  // then start the program stopped timer
  if (newValue === 1)
  {
    clearTimeout(timers.programStopped);

    timers.programStopped = setTimeout(function()
    {
      delete timers.programStopped;

      zone.programStopped();
    }, PROGRAM_STOPPED_TIMEOUT);

    return;
  }

  // If the stop button is released and the program stopped timer is running
  // then stop it
  if (newValue === 0 && timers.programStopped)
  {
    clearTimeout(timers.programStopped);

    delete timers.programStopped;
  }
}

/**
 * @param {Zone} zone
 * @param {Number} newValue
 * @param {Number} oldValue
 */
function handleConnectedChange(zone, newValue, oldValue)
{
  var timers = zone.timers;

  // If the zone cart was plugged off, start the plugged off timer
  if (newValue === 0)
  {
    clearTimeout(timers.zonePluggedOff);

    timers.zonePluggedOff = setTimeout(function()
    {
      delete timers.zonePluggedOff;

      zone.changeState('programErrored', {error: 'Odłączenie wózka strefy.'});
    }, PLUGGED_OFF_TIMEOUT);

    return;
  }

  // If the zone cart was plugged in and the plugged off timer is running
  // then stop it
  if (newValue === 1 && timers.zonePluggedOff)
  {
    clearTimeout(timers.zonePluggedOff);

    delete timers.zonePluggedOff;
  }
}

/**
 * @param {Zone} zone
 * @param {Number} stepIndex
 * @param {Number} stepIteration
 * @param {Number} [turnOnStartTime]
 */
function executeStep(zone, stepIndex, stepIteration, turnOnStartTime)
{
  var program = zone.program;
  var programStep = program.steps[stepIndex];

  if (!program.running)
  {
    return;
  }

  if (!programStep)
  {
    if (program.infinite)
    {
      return process.nextTick(function()
      {
        program.remainingTime = zone.program.totalTime;

        executeStep(zone, 0, 0);
      });
    }

    return process.nextTick(function()
    {
      zone.changeState('programFinished');
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
      var next = this;
      var startTime = turnOnStartTime || Date.now();

      zone.setState(true, function(err)
      {
        if (!program.running)
        {
          return;
        }

        if (err)
        {
          return next(err);
        }

        zone.updateProgress(
          program.remainingTime, 'on', stepIndex, stepIteration
        );

        var timeOn = (programStep.timeOn * 1000) - (Date.now() - startTime);

        if (timeOn > 0)
        {
          zone.timers.nextProgramStep = setTimeout(next, timeOn);
        }
        else
        {
          process.nextTick(next);
        }
      });
    },
    function turnOffStep(err)
    {
      if (!program.running)
      {
        return;
      }

      var next = this;

      if (err)
      {
        throw err;
      }

      var startTime = Date.now();

      program.remainingTime -= programStep.timeOn;

      zone.setState(false, function(err)
      {
        if (!program.running)
        {
          return;
        }

        if (err)
        {
          return next(err);
        }

        zone.updateProgress(
          program.remainingTime, 'off', stepIndex, stepIteration
        );

        var timeOff = (programStep.timeOff * 1000) - (Date.now() - startTime);

        if (timeOff > 0)
        {
          zone.timers.nextProgramStep = setTimeout(next, timeOff);
        }
        else
        {
          process.nextTick(next);
        }
      });
    },
    function nextIterationStep(err)
    {
      if (!program.running)
      {
        return;
      }

      var startTime = Date.now();

      if (err)
      {
        process.nextTick(function()
        {
          zone.changeState('programErrored', {error: err});
        });
      }
      else
      {
        program.remainingTime -= programStep.timeOff;

        process.nextTick(function()
        {
          executeStep(zone, stepIndex, stepIteration + 1, startTime);
        });
      }
    }
  );
}
