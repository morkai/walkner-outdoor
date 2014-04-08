// Copyright (c) 2014, Łukasz Walukiewicz <lukasz@walukiewicz.eu>. Some Rights Reserved.
// Licensed under CC BY-NC-SA 4.0 <http://creativecommons.org/licenses/by-nc-sa/4.0/>.
// Part of the walkner-outdoor project <http://lukasz.walukiewicz.eu/p/walkner-outdoor>

exports.validLeaveStates = [
  'disconnected',
  'connected',
  'stopped',
  'programRunning'
];

exports.enter = function(oldState, options, done)
{
  this.inputChangeListener = onInputChange;

  this.cancelConnectedStateReset = this.turnOff();
  this.cancelConnectedGreenLedReset = this.forceLeds({green: false});
  this.cancelConnectedLedBlinking = this.blinkLed('red', false);

  done();
};

exports.leave = function(newState, options, done)
{
  this.inputChangeListener = null;

  this.cancelConnectedStateReset();
  delete this.cancelConnectedStateReset;

  this.cancelConnectedGreenLedReset();
  delete this.cancelConnectedGreenLedReset;

  this.cancelConnectedLedBlinking();
  delete this.cancelConnectedLedBlinking;

  done();
};

/**
 * @param {String} input
 * @param {Number} newValue
 * @param {Number} oldValue
 */
function onInputChange(input, newValue, oldValue)
{
  if (input === 'stopButton')
  {
    return handleStopButtonChange(this, newValue, oldValue);
  }
}

/**
 * @param {Zone} zone
 * @param {Number} newValue
 * @param {Number} oldValue
 */
function handleStopButtonChange(zone, newValue, oldValue)
{
  // If the stop button is released (newValue=0) right after
  // connect (oldValue=-1) then the zone needs to be reset
  if (newValue === 0 && oldValue === -1)
  {
    return zone.needsReset();
  }

  // If the stop button is released (newValue=0 and oldValue=1)
  // then start the assigned program
  if (newValue === 0 && oldValue === 1)
  {
    return zone.startAssignedProgram();
  }
}
