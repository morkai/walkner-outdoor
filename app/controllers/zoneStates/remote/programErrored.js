exports.validLeaveStates = [
  'remote/disconnected',
  'remote/stopped',
  'remote/connected'
];

exports.enter = function(oldState, options, done)
{
  var zone = this;

  done();

  if (options.skip)
  {
    zone.changeState('connected');
  }
  else
  {
    done();

    zone.inputChangeListener = onInputChange;

    zone.finishProgram(options.error.message || options.error);
  }
};

exports.leave = function(newState, options, done)
{
  this.inputChangeListener = null;

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
