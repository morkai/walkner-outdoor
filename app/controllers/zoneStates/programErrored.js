// Copyright (c) 2014, Łukasz Walukiewicz <lukasz@walukiewicz.eu>. Some Rights Reserved.
// Licensed under CC BY-NC-SA 4.0 <http://creativecommons.org/licenses/by-nc-sa/4.0/>.
// Part of the walkner-outdoor project <http://lukasz.walukiewicz.eu/p/walkner-outdoor>

exports.validLeaveStates = [
  'disconnected',
  'stopped',
  'connected'
];

exports.enter = function(oldState, options, done)
{
  var zone = this;

  if (options.skip)
  {
    process.nextTick(function()
    {
      zone.changeState('connected');
    });
  }
  else
  {
    zone.inputChangeListener = onInputChange;

    zone.cancelProgramErroredStateReset = this.turnOff();
    zone.cancelProgramErroredLedBlinking = this.blinkLeds(false);

    zone.finishProgram(options.error.message || options.error);
  }

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
