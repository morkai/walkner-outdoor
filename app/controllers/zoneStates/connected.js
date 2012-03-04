const START_ASSIGNED_PROGRAM_TIMEOUT = 2000;

exports.validLeaveStates = [
  'disconnected',
  'connected',
  'stopped',
  'programRunning'
];

exports.enter = function(oldState, options, done)
{
  this.inputChangeListener = onInputChange;

  this.cancelConnectedStateReset = this.turnOff();
  this.cancelConnectedGreenLedReset = this.forceLeds({green: false});
  this.cancelConnectedLedBlinking = this.blinkLed('red', false);

  done();
};

exports.leave = function(newState, options, done)
{
  this.inputChangeListener = null;

  clearTimeout(this.timers.startAssignedProgram);
  delete this.timers.startAssignedProgram;

  this.cancelConnectedStateReset();
  delete this.cancelConnectedStateReset;

  this.cancelConnectedGreenLedReset();
  delete this.cancelConnectedGreenLedReset;

  this.cancelConnectedLedBlinking();
  delete this.cancelConnectedLedBlinking;

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
 * @param {Zone} zone
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

  var timers = zone.timers;

  // If the stop button is released (newValue=0 and oldValue=1)
  // then start the start assigned program timer
  if (newValue === 0 && oldValue === 1)
  {
    clearTimeout(timers.startAssignedProgram);

    timers.startAssignedProgram = setTimeout(function()
    {
      delete timers.startAssignedProgram;

      zone.startAssignedProgram();
    }, START_ASSIGNED_PROGRAM_TIMEOUT);

    return;
  }

  // If the stop button is pressed (newValue=1 and oldValue=0) and the start
  // assigned program timer is running then stop it
  if (newValue === 1 && oldValue === 0)
  {
    clearTimeout(timers.startAssignedProgram);

    delete timers.startAssignedProgram;

    return;
  }
}
