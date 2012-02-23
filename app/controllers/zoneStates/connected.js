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

  this.startInputMonitor();

  done();
};

exports.leave = function(newState, options, done)
{
  this.inputChangeListener = null;

  this.cancelConnectedStateReset();
  delete this.cancelConnectedStateReset;

  this.cancelConnectedGreenLedReset();
  delete this.cancelConnectedGreenLedReset;

  this.cancelConnectedLedBlinking();
  delete this.cancelConnectedLedBlinking;

  done();
};

function onInputChange(input, newValue, oldValue)
{
  if (input === 'stopButton')
  {
    return handleStopButtonChange.call(this, newValue, oldValue);
  }
}

function handleStopButtonChange(newValue, oldValue)
{
  // If somehow stop button is changed while the zone cart is not plugged in
  // to a power supply then the zone needs to be reset
  if (this.doesNeedPlugIn)
  {
    return this.needsReset();
  }

  // If the stop button is released (newValue=0) right after
  // connect (oldValue=-1) then the zone needs to be reset
  if (newValue === 0 && oldValue === -1)
  {
    return this.needsReset();
  }

  // If the stop button is pressed (newValue=1) and the zone needs a reset
  // (doesNeedReset=true) then consider the zone to be reset
  if (this.doesNeedReset && newValue === 1)
  {
    return this.wasReset();
  }

  // If the stop button is released (newValue=0 and oldValue=1)
  // then start a program assigned to this zone
  if (!this.doesNeedReset && newValue === 0 && oldValue === 1)
  {
    return this.startAssignedProgram();
  }
}
