exports.validLeaveStates = [
  'disconnected',
  'stopped',
  'connected'
];

exports.enter = function(oldState, options, done)
{
  this.inputChangeListener = onInputChange;

  this.setState(false);
  this.blinkLeds(false);

  done();
};

exports.leave = function(newState, options, done)
{
  this.inputChangeListener = null;

  this.stopLedBlinking();

  done();
};

function onInputChange(input, newValue, oldValue)
{
  // If the stop button is pressed (newValue=1) then consider the zone
  // reset and restore it to the connected state
  if (input === 'stopButton' && newValue === 1)
  {
    this.connected();
    this.wasReset();
  }
}
