// Copyright (c) 2014, Łukasz Walukiewicz <lukasz@walukiewicz.eu>. Some Rights Reserved.
// Licensed under CC BY-NC-SA 4.0 <http://creativecommons.org/licenses/by-nc-sa/4.0/>.
// Part of the walkner-outdoor project <http://lukasz.walukiewicz.eu/p/walkner-outdoor>

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
