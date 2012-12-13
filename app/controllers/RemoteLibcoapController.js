var util = require('util');
var spawn = require('child_process').spawn;
var Controller = require('./Controller');
var LibcoapController = require('./LibcoapController');
var RemoteZone = require('./RemoteZone');
var config = require('../../config/libcoap');
var compileProgram = require('../utils/program').compileProgram;

var STATE_MONITOR_INTERVAL = 400;
var STATE_WITH_ID_LENGTH = 22;
var STATE_WITHOUT_ID_LENGTH = 10;

/**
 * @constructor
 * @extends LibcoapController
 */
function RemoteLibcoapController(process)
{
  LibcoapController.call(this, process);

  this.cancelRemoteStateMonitor = null;
  this.lastInputsUpdate = 0;
  this.inputs = {
    connected: -1,
    stopButton: -1
  };
}

util.inherits(RemoteLibcoapController, LibcoapController);

/**
 * @param {?Function} done
 */
RemoteLibcoapController.prototype.initialize = function(done)
{
  LibcoapController.prototype.initialize.call(this, done);
};

/**
 * @param {?Function} done
 */
RemoteLibcoapController.prototype.finalize = function(done)
{
  LibcoapController.prototype.finalize.call(this, done);
};

/**
 * @param {Object} zone
 * @return {RemoteZone}
 */
RemoteLibcoapController.prototype.createZone = function(zone)
{
  return new RemoteZone(this, zone);
};

/**
 * @param {String} input
 * @param {Object} controllerInfo
 * @param {Function} [done]
 */
RemoteLibcoapController.prototype.getZoneInput =
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
RemoteLibcoapController.prototype.getRemoteState = function(done)
{
  var controller = this;

  var cmd = config.coapClientPath
    + ' -o -'
    + ' -T ' + this.nextToken()
    + ' ' + this.getResourceUri('/state');

  this.execCmd(cmd, function(err, stdout)
  {
    if (err)
    {
      return done(err);
    }

    var buf = new Buffer(stdout, 'binary');

    if (buf.length !== STATE_WITHOUT_ID_LENGTH
      && buf.length !== STATE_WITH_ID_LENGTH)
    {
      return done(util.format(
        "Invalid remote state buffer length. Expected [10] or [22] bytes, got [%d]",
        buf.length
      ));
    }

    controller.lastInputsUpdate = Date.now();
    controller.inputs = {
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
  });
};

/**
 * @param {Number} remoteState
 * @param {Function} [done]
 */
RemoteLibcoapController.prototype.setRemoteState = function(remoteState, done)
{
  this.execCmdWithData(
    [
      '-m', 'put',
      '-f', '-',
      '-t', this.nextToken(),
      this.getResourceUri('/state')
    ],
    new Buffer([remoteState]),
    done
  );
};

/**
 * @param {String} program
 * @param {Function} [done]
 */
RemoteLibcoapController.prototype.startRemoteProgram = function(program, done)
{
  this.execCmdWithData(
    [
      '-m', 'put',
      '-b', '64',
      '-f', '-',
      '-t', this.nextToken(),
      this.getResourceUri('/start')
    ],
    compileProgram(program),
    done
  );
};

/**
 * @param {Object} assignedProgram
 * @param {Function} [done]
 */
RemoteLibcoapController.prototype.program = function(assignedProgram, done)
{
  this.execCmdWithData(
    [
      '-m', 'put',
      '-b', '64',
      '-f', '-',
      '-t', this.nextToken(),
      this.getResourceUri('/program')
    ],
    compileProgram(assignedProgram),
    done
  );
};

/**
 * @param {Function} [done]
 */
RemoteLibcoapController.prototype.stopRemoteProgram = function(done)
{
  var cmd = config.coapClientPath
    + ' -m put '
    + ' -T ' + this.nextToken()
    + ' ' + this.getResourceUri('/stop');

  this.execCmd(cmd, done);
};

/**
 * @param {Function} listener
 */
RemoteLibcoapController.prototype.startRemoteStateMonitor = function(listener)
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

RemoteLibcoapController.prototype.stopRemoteStateMonitor = function()
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
RemoteLibcoapController.prototype.markProgramAsInterrupted = function(zoneId, interruptedProgram)
{
  this.sendMessage('markProgramAsInterrupted', {
    zoneId: zoneId,
    programId: interruptedProgram._id,
    interruptTime: interruptedProgram.interruptTime
  });
};

/**
 * @private
 * @param {Array} cmd
 * @param {Buffer} data
 * @param {Function} [done]
 * @param {Number} [maxRetries]
 * @param {Number} [count]
 * @param {Number} [startTime]
 */
RemoteLibcoapController.prototype.execCmdWithData =
  function(cmd, data, done, maxRetries, count, startTime)
{
  if (done && done.cancelled)
  {
    return;
  }

  if (typeof maxRetries === 'undefined')
  {
    maxRetries = 0;
  }

  if (typeof count === 'undefined')
  {
    count = 0;
  }

  if (typeof startTime === 'undefined')
  {
    startTime = Date.now();
  }

  var controller = this;
  var client = spawn(config.coapClientPath, cmd);
  var stdout = '';
  var timeoutTimer = setTimeout(function() { client.kill('SIGKILL'); }, config.coapClientTimeout);

  client.stdout.on('data', function(data)
  {
    stdout += data;
  });

  client.on('exit', function(err, signal)
  {
    clearTimeout(timeoutTimer);

    count += 1;

    if (stdout.indexOf('400') !== -1)
    {
      err = stdout;
    }

    if ((err || signal === 'SIGKILL') && count <= maxRetries)
    {
      process.nextTick(function()
      {
        controller.execCmdWithData(
          cmd, data, done, maxRetries, count, startTime
        );
      });
    }
    else
    {
      controller.requestTimed(Date.now() - startTime);

      if (err)
      {
        controller.startDisconnectTimer();
      }
      else
      {
        controller.stopDisconnectTimer();
      }

      if (done && !done.cancelled)
      {
        return done(err);
      }
    }
  });

  client.stdin.write(data);
  client.stdin.end();
};

module.exports = RemoteLibcoapController;
