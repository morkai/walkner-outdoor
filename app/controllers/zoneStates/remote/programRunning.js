var util = require('util');
var _ = require('underscore');
var step = require('step');
var RemoteZone;

process.nextTick(function()
{
  RemoteZone = require('../../RemoteZone');
});

exports.validLeaveStates = [
  'remote/disconnected',
  'remote/stopped',
  'remote/programErrored',
  'remote/programStopped',
  'remote/programFinished'
];

exports.enter = function(oldState, options, done)
{
  var zone = this;
  var remoteState = options.remoteState;

  if (remoteState)
  {
    zone.program = zone.interruptedProgram;
    zone.interruptedProgram = null;

    if (zone.program)
    {
      // TODO: change client state

      startRemoteStateMonitor(zone);

      process.nextTick(function()
      {
        updateRemoteProgress(zone, remoteState);
      });

      done();
    }
    else
    {
      zone.setRemoteState(RemoteZone.STATE_CONNECTED, function(err)
      {
        if (err)
        {
          throw err;
        }

        process.nextTick(function()
        {
          zone.changeState('programErrored', {skip: true});
        });

        done();
      });
    }
  }
  else
  {
    startRemoteProgram(this, _.clone(options.program), done);
  }
};

exports.leave = function(newState, options, done)
{
  var zone = this;

  zone.inputChangeListener = null;

  zone.stopRemoteStateMonitor();

  if (newState === 'remote/disconnected')
  {
    zone.interruptedProgram = zone.program;
    zone.program = null;
  }

  delete zone.progressUpdated;

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
 * @param {RemoteZone} zone
 * @param {Number} newValue
 * @param {Number} oldValue
 */
function handleStopButtonChange(zone, newValue, oldValue)
{
  // Ignore the stop button input changes if the program was not started
  // manually
  if (!zone.program.manual)
  {
    return;
  }

  // If the stop button is pressed (newValue=1) then stop the running program
  if (newValue === 1)
  {
    return zone.programStopped();
  }
}

/**
 * @param {RemoteZone} zone
 * @param {Number} newValue
 * @param {Number} oldValue
 */
function handleConnectedChange(zone, newValue, oldValue)
{
  // If the zone cart was plugged off then stop the running program
  // with an error
  if (newValue === 0)
  {
    return zone.changeState('programErrored', {
      error: "Odłączenie wózka strefy."
    });
  }
}

/**
 * @param {RemoteZone} zone
 * @param {Object} program
 * @param {Function} done
 */
function startRemoteProgram(zone, program, done)
{
  zone.startRemoteProgram(program, function(err)
  {
    if (err)
    {
      process.nextTick(function()
      {
        zone.changeState('programErrored', {
          skip: true
        });
      });

      return done("nie udało się załadować programu na sterownik :(");
    }

    startRemoteStateMonitor(zone);

    process.nextTick(function()
    {
      zone.updateProgress(program.totalTime, 'on', 0, 0);
    });

    done();
  });
}

/**
 * @param {RemoteZone} zone
 */
function startRemoteStateMonitor(zone)
{
  zone.startRemoteStateMonitor(zone.makeCancellable(function(remoteState)
  {
    switch (remoteState.code)
    {
      case RemoteZone.STATE_PROGRAM_RUNNING:
        handleProgramRunningState(zone, remoteState);
        break;

      case RemoteZone.STATE_PROGRAM_FINISHED:
        handleProgramFinishedState(zone);
        break;

      case RemoteZone.STATE_PROGRAM_STOPPED:
        handleProgramStoppedState(zone);
        break;

      default:
        console.error(
          "Unexpected remote state during program execution on zone [%s]: %d",
          zone.zone.name,
          remoteState.code
        );
    }
  }));
}

function handleProgramRunningState(zone, remoteState)
{
  if (!zone.progressUpdated
    && remoteState.stepIndex === 0
    && remoteState.stepIteration === 0)
  {
    var remainingTime = zone.program.totalTime - remoteState.elapsedTime;

    if (!remoteState.stepState)
    {
      remainingTime -= zone.program.steps[0].timeOn;
    }

    zone.updateProgress(
      remainingTime,
      remoteState.stepState ? 'on' : 'off',
      0,
      0
    );

    zone.progressUpdated = true;
  }
  else
  {
    zone.progressUpdated = false;
  }
}

function handleProgramFinishedState(zone)
{
  zone.stopRemoteStateMonitor();

  process.nextTick(function()
  {
    zone.changeState('programFinished');
  });
}

function handleProgramStoppedState(zone)
{
  zone.stopRemoteStateMonitor();

  process.nextTick(function()
  {
    zone.programStopped();
  });
}

function updateRemoteProgress(zone, remoteState)
{
  var program = zone.program;
  var remainingTime = program.totalTime;

  for (var i = 0; i < remoteState.stepIndex; ++i)
  {
    var step = program.steps[i];

    remainingTime -= (step.timeOn + step.timeOff) * step.iterations;
  }

  var currentStep = program.steps[remoteState.stepIndex];

  remainingTime -=
    (currentStep.timeOn + currentStep.timeOff) * remoteState.stepIteration;

  if (remoteState.stepState)
  {
    remainingTime -= remoteState.elapsedTime;
  }
  else
  {
    remainingTime -= currentStep.timeOn + remoteState.elapsedTime;
  }

  zone.updateProgress(
    remainingTime,
    remoteState.stepState ? 'on' : 'off',
    remoteState.stepIndex,
    remoteState.stepIteration
  );
}
