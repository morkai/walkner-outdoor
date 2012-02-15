var step = require('step');

exports.validLeaveStates = [];

exports.enter = function(oldState, options, done)
{
  this.finishProgram(options.stopReason);

  if (this.controller.isConnected)
  {
    var zone = this;

    step(
      function resetStep()
      {
        var group = this.group();

        zone.setState(false, group());
        zone.setLeds({green: false, red: false}, group());
      },
      function doneStep()
      {
        done();
      }
    );
  }
  else
  {
    done();
  }
};

exports.leave = function()
{
  throw new Error('Cannot leave the `stopped` state.');
};
