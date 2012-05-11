var RemoteZone;

process.nextTick(function()
{
  RemoteZone = require('../../RemoteZone');
});

exports.validLeaveStates = [
  'remote/disconnected',
  'remote/connected',
  'remote/stopped',
  'remote/programRunning',
  'remote/programStopped',
  'remote/programFinished'
];

exports.enter = function(oldState, options, done)
{
  var zone = this;

  zone.inputChangeListener = onInputChange;

  if (oldState === 'remote/disconnected')
  {
    handleReconnect(zone, done);
  }
  else
  {
    handleConnectedState(zone);

    done();
  }
};

exports.leave = function(newState, options, done)
{
  var zone = this;

  zone.inputChangeListener = null;

  delete zone.uploadAssignedProgram;

  zone.stopRemoteStateMonitor();

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
}

/**
 * @param {RemoteZone} zone
 * @param {Number} newValue
 * @param {Number} oldValue
 */
function handleStopButtonChange(zone, newValue, oldValue)
{
  // If the stop button is released (newValue=0) right after
  // connect (oldValue=-1) then the zone needs to be reset
  if (newValue === 0 && oldValue === -1)
  {
    return zone.needsReset();
  }
}

/**
 * @param {RemoteZone} zone
 */
function handleReconnect(zone, done)
{
  function getRemoteState()
  {
    zone.getRemoteState(
      zone.makeCancellable(function(err, remoteState)
      {
        if (err)
        {
          process.nextTick(getRemoteState);
        }
        else
        {
          done();

          process.nextTick(function()
          {
            handleRemoteStateChange(zone, remoteState);
          });
        }
      })
    );
  }

  getRemoteState();
}

/**
 * @param {RemoteZone} zone
 * @param {RemoteState} remoteState
 */
function handleRemoteStateChange(zone, remoteState)
{
  switch (remoteState.code)
  {
    case RemoteZone.STATE_NOT_CONNECTED:
      handleNotConnectedState(zone);
      break;

    case RemoteZone.STATE_CONNECTED:
      handleConnectedState(zone);
      break;

    case RemoteZone.STATE_PROGRAM_RUNNING:
      handleProgramRunningState(zone, remoteState);
      break;

    case RemoteZone.STATE_PROGRAM_FINISHED:
      handleProgramFinishedState(zone, remoteState);
      break;

    case RemoteZone.STATE_PROGRAM_STOPPED:
      handleProgramStoppedState(zone, remoteState);
      break;

    case RemoteZone.STATE_DOWNLOADING:
      handleDownloadingState(zone);
      break;
  }
}

/**
 * @param {RemoteZone} zone
 */
function handleNotConnectedState(zone)
{
  function handleResponse(err)
  {
    if (err)
    {
      handleNotConnectedState(zone);
    }
    else
    {
      handleConnectedState(zone);
    }
  }

  zone.setRemoteState(
    RemoteZone.STATE_CONNECTED, zone.makeCancellable(handleResponse)
  );
}

/**
 * @param {RemoteZone} zone
 */
function handleConnectedState(zone)
{
  zone.startRemoteStateMonitor(
    zone.makeCancellable(true, function(remoteState)
    {
      if (remoteState.code === RemoteZone.STATE_CONNECTED)
      {
        zone.uploadAssignedProgram();
      }
      else
      {
        handleRemoteStateChange(zone, remoteState);
      }
    })
  );
}

/**
 * @param {RemoteZone} zone
 * @param {RemoteState} remoteState
 */
function handleProgramRunningState(zone, remoteState)
{
  zone.stopRemoteStateMonitor();

  process.nextTick(function()
  {
    zone.changeState('programRunning', {
      remoteState: remoteState
    });
  });
}

/**
 * @param {RemoteZone} zone
 */
function handleProgramFinishedState(zone)
{
  zone.stopRemoteStateMonitor();

  zone.setRemoteState(RemoteZone.STATE_CONNECTED, function(err)
  {
    if (err)
    {
      throw err;
    }

    zone.finishProgram();

    process.nextTick(function()
    {
      handleConnectedState(zone);
    });
  });
}

/**
 * @param {RemoteZone} zone
 */
function handleProgramStoppedState(zone)
{
  zone.stopRemoteStateMonitor();

  zone.setRemoteState(RemoteZone.STATE_CONNECTED, function(err)
  {
    if (err)
    {
      throw err;
    }

    zone.remoteProgramStopped();

    process.nextTick(function()
    {
      handleConnectedState(zone);
    });
  });
}

/**
 * @param {RemoteZone} zone
 */
function handleDownloadingState(zone)
{
  function getNewRemoteState()
  {
    function handleNewRemoteState(err, newRemoteState)
    {
      handleRemoteStateChange(
        zone, err ? {code: RemoteZone.STATE_DOWNLOADING} : newRemoteState
      );
    }

    zone.getRemoteState(zone.makeCancellable(handleNewRemoteState));
  }

  setTimeout(zone.makeCancellable(getNewRemoteState), 1000);
}
