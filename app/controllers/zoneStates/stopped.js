// Copyright (c) 2014, Łukasz Walukiewicz <lukasz@walukiewicz.eu>. Some Rights Reserved.
// Licensed under CC BY-NC-SA 4.0 <http://creativecommons.org/licenses/by-nc-sa/4.0/>.
// Part of the walkner-outdoor project <http://lukasz.walukiewicz.eu/p/walkner-outdoor>

var step = require('h5.step');

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
        zone.setState(false, this.parallel());
        zone.setLeds({green: false, red: false}, this.parallel());
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
