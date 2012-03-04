exports.validLeaveStates = [
  'disconnected',
  'stopped',
  'connected'
];

exports.enter = function(oldState, options, done)
{
  this.inputChangeListener = onInputChange;

  this.cancelProgramErroredStateReset = this.turnOff();
  this.cancelProgramErroredLedBlinking = this.blinkLeds(false);

  this.finishProgram(options.error.message || options.error);

  done();
};

exports.leave = function(newState, options, done)
{
  this.inputChangeListener = null;

  this.cancelProgramErroredStateReset();
  delete this.cancelProgramErroredStateReset;

  this.cancelProgramErroredLedBlinking();
  delete this.cancelProgramErroredLedBlinking;

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
