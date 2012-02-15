var _ = require('underscore');
var step = require('step');

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
      err = "Nie udało się ustawić lamp.";

      process.nextTick(function()
      {
        zone.changeState('programErrored', {error: err});
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

  delete this.program.remainingTime;
  delete this.program.running;

  done();
};

function onInputChange(input, newValue, oldValue)
{
  // If the stop button is pressed (newValue=1)
  // then manually stop the running program
  if (input === 'stopButton' && newValue === 1)
  {
    this.programStopped();
  }
}

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
      var next      = this;
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
