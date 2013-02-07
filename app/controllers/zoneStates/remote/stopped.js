exports.validLeaveStates = [];

exports.enter = function(oldState, options, done)
{
  this.finishProgram(options.stopReason);

  done();
};

exports.leave = function()
{
  throw new Error('Cannot leave the `stopped` state.');
};
