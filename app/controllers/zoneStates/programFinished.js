exports.validLeaveStates = [
  'disconnected',
  'stopped',
  'connected'
];

exports.enter = function(oldState, options, done)
{
  this.inputChangeListener = onInputChange;

  this.cancelProgramFinishedRedLedReset = this.forceLeds({red: false});
  this.cancelProgramFinishedLedBlinking = this.blinkLed('green', false);

  this.finishProgram();

  done();
};

exports.leave = function(newState, options, done)
{
  this.inputChangeListener = null;

  this.cancelProgramFinishedRedLedReset();
  delete this.cancelProgramFinishedRedLedReset;

  this.cancelProgramFinishedLedBlinking();
  delete this.cancelProgramFinishedLedBlinking;

  done();
};

function onInputChange(input, newValue, oldValue)
{
  // If the stop button is pressed (newValue=1) then consider the zone
  // reset and restore it to the connected state
  if (input === 'stopButton' && newValue === 1)
  {
    return this.connected();
  }

  // If the zone cart was plugged off a power supply then switch to
  // the connected state
  if (input === 'connected' && newValue === 0)
  {
    return this.connected();
  }
}
