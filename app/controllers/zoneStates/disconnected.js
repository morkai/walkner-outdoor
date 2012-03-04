var util = require('util');

exports.validLeaveStates = [
  'stopped',
  'connected',
  'disconnected'
];

exports.enter = function(oldState, options, done)
{
  this.stopInputMonitor();

  // Set all inputs to -1 to indicate that the next input change
  // is the first one after connection was established (oldValue=-1)
  for (var input in this.inputs)
  {
    this.inputs[input] = -1;
    this.inputChanges[input] = 0;
  }

  this.finishProgram("Utracono połączenie ze sterownikiem.");

  done();
};

exports.leave = function(newState, options, done)
{
  this.startInputMonitor();

  done();
};
