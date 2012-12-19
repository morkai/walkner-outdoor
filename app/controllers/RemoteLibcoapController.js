var _ = require('underscore');
var util = require('util');
var spawn = require('child_process').spawn;
var Controller = require('./Controller');
var LibcoapController = require('./LibcoapController');
var RemoteController = require('./RemoteController');
var RemoteZone = require('./RemoteZone');
var config = require('../../config/libcoap');
var compileProgram = require('../utils/program').compileProgram;

/**
 * @constructor
 * @extends LibcoapController
 * @extends RemoteController
 */
function RemoteLibcoapController(process)
{
  LibcoapController.call(this, process);
  RemoteController.call(this);
}

util.inherits(RemoteLibcoapController, LibcoapController);
_.extend(RemoteLibcoapController.prototype, RemoteController.prototype);

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

    controller.parseRemoteState(new Buffer(stdout, 'binary'), done);
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
