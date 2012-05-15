var util = require('util');
var spawn = require('child_process').spawn;
var _ = require('underscore');
var step = require('step');
var LibcoapController = require('./LibcoapController');
var RemoteZone = require('./RemoteZone');
var config = require('../../config/libcoap');
var compileProgram = require('../utils/program').compileProgram;

/**
 * @constructor
 * @extends LibcoapController
 */
function RemoteLibcoapController(process)
{
  LibcoapController.call(this, process);
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
 * @param {Function} done
 */
RemoteLibcoapController.prototype.getRemoteState = function(done)
{
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

    if (buf.length !== 20)
    {
      return done(util.format(
        "Invalid remote state buffer length. Expected [20] bytes, got [%d]",
        buf.length
      ));
    }

    var state = {
      code: buf[0],
      stepIndex: buf[1] - 1,
      stepIteration: buf.readUInt16BE(2) - 1,
      stepState: buf[4] === 1,
      elapsedTime: buf.readUInt16BE(5),
      manual: buf[7] === 1,
      programId: buf.length >= 20 ? buf.toString('hex', 8, 20) : null
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

      controller.timers.remoteStateMonitor = setTimeout(monitorState, 400);

      if (!err)
      {
        listener(remoteState);
      }
    });
  }

  if (!controller.timers.remoteStateMonitor)
  {
    controller.timers.remoteStateMonitor = setTimeout(monitorState, 1);
  }
};

RemoteLibcoapController.prototype.stopRemoteStateMonitor = function()
{
  clearTimeout(this.timers.remoteStateMonitor);
  delete this.timers.remoteStateMonitor;
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

  client.stdout.on('data', function(data)
  {
    stdout += data;
  });

  client.on('exit', function(err)
  {
    count += 1;

    if (stdout.indexOf('400') !== -1)
    {
      err = stdout;
    }

    if (err && count <= maxRetries)
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
