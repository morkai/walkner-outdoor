exports.validLeaveStates = [
  'disconnected',
  'stopped',
  'connected'
];

exports.enter = function(oldState, options, done)
{
  this.inputChangeListener = onInputChange;

  this.cancelProgramStoppedStateReset = this.turnOff();
  this.cancelProgramStoppedLedBlinking = this.blinkLeds(false);

  done();
};

exports.leave = function(newState, options, done)
{
  this.inputChangeListener = null;

  this.cancelProgramStoppedStateReset();
  delete this.cancelProgramStoppedStateReset;

  this.cancelProgramStoppedLedBlinking();
  delete this.cancelProgramStoppedLedBlinking;

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
