// Copyright (c) 2014, Łukasz Walukiewicz <lukasz@walukiewicz.eu>. Some Rights Reserved.
// Licensed under CC BY-NC-SA 4.0 <http://creativecommons.org/licenses/by-nc-sa/4.0/>.
// Part of the walkner-outdoor project <http://lukasz.walukiewicz.eu/p/walkner-outdoor>

var util = require('util');
var _ = require('underscore');
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
    zone.interruptedProgram.interruptTime = Date.now();
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
  console.debug(
    'Resuming an interrupted program [%s] on zone [%s].',
    zone.program.name,
    zone.zone.name
  );

  done();

  zone.remoteProgramRunning(remoteState);
  startRemoteStateMonitor(zone);
  updateRemoteProgress(zone, remoteState);
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
    console.debug(
      'Stopping an unknown program [%s] on zone [%s].',
      remoteState.programId,
      zone.zone.name
    );

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

      done();

      setTimeout(zone.makeCancellable(function()
      {
        zone.changeState('programErrored', {skip: true});
      }), 500);
    });
  });
}

/**
 * @param {RemoteZone} zone
 * @param {RemoteState} remoteState
 * @param {Function} done
 */
function handleManualStart(zone, remoteState, done)
{
  done();

  zone.program = _.clone(zone.assignedProgram);

  zone.remoteProgramRunning(remoteState);
  startRemoteStateMonitor(zone);
  updateRemoteProgress(zone, remoteState);
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
      done("nie udało się załadować programu na sterownik :(");

      zone.changeState('programErrored', {
        skip: true
      });
    }
    else
    {
      done();

      zone.updateProgress(program.totalTime, 'on', 0, 0);

      setTimeout(zone.makeCancellable(function()
      {
        startRemoteStateMonitor(zone);
      }), 1000);
    }
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

      case RemoteZone.STATE_CONNECTED:
        handleRemoteControllerRestart(zone);
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
  zone.changeState('programFinished');
}

/**
 * @param {RemoteZone} zone
 */
function handleProgramStoppedState(zone)
{
  zone.stopRemoteStateMonitor();
  zone.programStopped();
}

/**
 * @param {RemoteZone} zone
 */
function handleRemoteControllerRestart(zone)
{
  zone.stopRemoteStateMonitor();
  zone.changeState('programErrored', {error: 'Nieoczekiwany restart sterownika.'});
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
