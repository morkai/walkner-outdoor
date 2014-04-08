// Copyright (c) 2014, Łukasz Walukiewicz <lukasz@walukiewicz.eu>. Some Rights Reserved.
// Licensed under CC BY-NC-SA 4.0 <http://creativecommons.org/licenses/by-nc-sa/4.0/>.
// Part of the walkner-outdoor project <http://lukasz.walukiewicz.eu/p/walkner-outdoor>

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
  if (newState.indexOf('stopped') === -1 && newState.indexOf('disconnected') === -1)
  {
    this.startInputMonitor();
  }

  done();
};
