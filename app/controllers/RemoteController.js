var util = require('util');
var _ = require('underscore');
var step = require('step');
var Controller = require('./Controller');
var RemoteZone = require('./RemoteZone');

var STATE_MONITOR_INTERVAL = 400;
var STATE_WITH_ID_LENGTH = 22;
var STATE_WITHOUT_ID_LENGTH = 10;

function RemoteController()
{
  this.cancelRemoteStateMonitor = null;
  this.lastInputsUpdate = 0;
  this.inputs = {
    connected: -1,
    stopButton: -1
  };
}

/**
 * @param {Object} zone
 * @return {RemoteZone}
 */
RemoteController.prototype.createZone = function(zone)
{
  return new RemoteZone(this, zone);
};

/**
 * @param {String} input
 * @param {Object} controllerInfo
 * @param {Function} [done]
 */
RemoteController.prototype.getZoneInput =
  function(input, controllerInfo, done)
{
  var inputs = this.inputs;

  if (this.lastInputsUpdate < Date.now() - 2000)
  {
    this.getRemoteState(function(err)
    {
      if (err)
      {
        done && done(err);
      }
      else
      {
        done && done(null, inputs[input]);
      }
    });
  }
  else
  {
    done && done(null, inputs[input]);
  }
};

/**
 * @param {Function} done
 */
RemoteController.prototype.getRemoteState = function(done)
{
  done && done(new Error(
    "This controller does not support getting a remote state."
  ));
};

/**
 * @param {Number} remoteState
 * @param {Function} [done]
 */
RemoteController.prototype.setRemoteState = function(remoteState, done)
{
  done && done(new Error(
    "This controller does not support setting a remote state."
  ));
};

/**
 * @param {String} program
 * @param {Function} [done]
 */
RemoteController.prototype.startRemoteProgram = function(program, done)
{
  done && done(new Error(
    "This controller does not support starting a remote program."
  ));
};

/**
 * @param {Object} assignedProgram
 * @param {Function} [done]
 */
RemoteController.prototype.program = function(assignedProgram, done)
{
  done && done(new Error(
    "This controller does not support assigning a remote program."
  ));
};

/**
 * @param {Function} [done]
 */
RemoteController.prototype.stopRemoteProgram = function(done)
{
  done && done(new Error(
    "This controller does not support stopping a remote program."
  ));
};

/**
 * @param {Function} listener
 */
RemoteController.prototype.startRemoteStateMonitor = function(listener)
{
  var controller = this;

  function monitorState()
  {
    if (!controller.timers.remoteStateMonitor)
    {
      return;
    }

    controller.getRemoteState(function(err, remoteState)
    {
      if (!controller.timers.remoteStateMonitor)
      {
        return;
      }

      controller.timers.remoteStateMonitor = setTimeout(monitorState, STATE_MONITOR_INTERVAL);

      if (!err)
      {
        listener(remoteState);
      }
    });
  }

  if (!controller.timers.remoteStateMonitor)
  {
    controller.timers.remoteStateMonitor = setTimeout(monitorState, 1);

    if (typeof listener.cancel === 'function')
    {
      controller.cancelRemoteStateMonitor = listener.cancel;
    }
  }
};

RemoteController.prototype.stopRemoteStateMonitor = function()
{
  clearTimeout(this.timers.remoteStateMonitor);
  this.timers.remoteStateMonitor = null;

  if (typeof this.cancelRemoteStateMonitor === 'function')
  {
    this.cancelRemoteStateMonitor();
    this.cancelRemoteStateMonitor = null;
  }
};

/**
 * @param {String} zoneId
 * @param {Object} interruptedProgram
 */
RemoteController.prototype.markProgramAsInterrupted = function(zoneId, interruptedProgram)
{
  this.sendMessage('markProgramAsInterrupted', {
    zoneId: zoneId,
    programId: interruptedProgram._id,
    interruptTime: interruptedProgram.interruptTime
  });
};

/**
 * @protected
 * @param {Buffer} buf
 * @param {Function} done
 */
RemoteController.prototype.parseRemoteState = function(buf, done)
{
  if (buf.length !== STATE_WITHOUT_ID_LENGTH
    && buf.length !== STATE_WITH_ID_LENGTH)
  {
    return done(util.format(
      "Invalid remote state buffer length. Expected [10] or [22] bytes, got [%d]",
      buf.length
    ));
  }

  this.lastInputsUpdate = Date.now();
  this.inputs = {
    connected: Controller.INPUT_STATE_VALUES.connected[buf[8] === 1],
    stopButton: Controller.INPUT_STATE_VALUES.stopButton[buf[9] === 1]
  };

  var state = {
    code: buf[0],
    stepIndex: buf[1] - 1,
    stepIteration: buf.readUInt16BE(2) - 1,
    stepState: buf[4] === 1,
    elapsedTime: buf.readUInt16BE(5),
    manual: buf[7] === 1,
    connected: buf[8] === 1,
    stopButton: buf[9] === 1,
    programId: buf.length === STATE_WITH_ID_LENGTH
      ? buf.toString('hex', STATE_WITHOUT_ID_LENGTH, STATE_WITH_ID_LENGTH)
      : null
  };

  done(null, state);
};

module.exports = RemoteController;
