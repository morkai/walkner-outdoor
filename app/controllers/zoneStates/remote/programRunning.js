var util = require('util');
var _ = require('underscore');
var step = require('step');
var calcRemainingTime = require('../../../utils/program').calcRemainingTime;
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

  zone.progressUpdated = false;

  if (remoteState)
  {
    zone.program = zone.interruptedProgram;
    zone.interruptedProgram = null;

    if (zone.program && zone.program._id === remoteState.programId)
    {
      handleInterruptedProgram(zone, remoteState, done);
    }
    else
    {
      handleUnknownProgram(zone, remoteState, done);
    }
  }
  else
  {
    startRemoteProgram(zone, _.clone(options.program), done);
  }
};

exports.leave = function(newState, options, done)
{
  var zone = this;

  zone.stopRemoteStateMonitor();

  if (newState === 'remote/disconnected')
  {
    zone.interruptedProgram = zone.program;
    zone.program = null;
  }

  done();
};

/**
 * @param {RemoteZone} zone
 * @param {RemoteState} remoteState
 * @param {Function} done
 */
function handleInterruptedProgram(zone, remoteState, done)
{
  zone.remoteProgramRunning(remoteState);

  startRemoteStateMonitor(zone);

  process.nextTick(function()
  {
    updateRemoteProgress(zone, remoteState);
  });

  done();
}

/**
 * @param {RemoteZone} zone
 * @param {RemoteState} remoteState
 * @param {Function} done
 */
function handleUnknownProgram(zone, remoteState, done)
{
  if (!zone.assignedProgram
    || remoteState.programId !== zone.assignedProgram._id)
  {
    stopUnknownProgram(zone, done);
  }
  else
  {
    handleManualStart(zone, remoteState, done);
  }
}

/**
 * @param {RemoteState} zone
 * @param {Function} done
 */
function stopUnknownProgram(zone, done)
{
  zone.stopRemoteProgram(function(err)
  {
    if (err)
    {
      throw err;
    }

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
    })
  });
}

/**
 * @param {RemoteZone} zone
 * @param {RemoteState} remoteState
 * @param {Function} done
 */
function handleManualStart(zone, remoteState, done)
{
  zone.program = _.clone(zone.assignedProgram);

  zone.remoteProgramRunning(remoteState);

  startRemoteStateMonitor(zone);

  process.nextTick(function()
  {
    updateRemoteProgress(zone, remoteState);
  });

  done();
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

/**
 * @param {RemoteZone} zone
 * @param {RemoteState} remoteState
 */
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

/**
 * @param {RemoteZone} zone
 */
function handleProgramFinishedState(zone)
{
  zone.stopRemoteStateMonitor();

  process.nextTick(function()
  {
    zone.changeState('programFinished');
  });
}

/**
 * @param {RemoteZone} zone
 */
function handleProgramStoppedState(zone)
{
  zone.stopRemoteStateMonitor();

  process.nextTick(function()
  {
    zone.programStopped();
  });
}

/**
 * @param {RemoteZone} zone
 * @param {RemoteState} remoteState
 */
function updateRemoteProgress(zone, remoteState)
{
  zone.updateProgress(
    calcRemainingTime(zone.program, remoteState),
    remoteState.stepState ? 'on' : 'off',
    remoteState.stepIndex,
    remoteState.stepIteration
  );
}
