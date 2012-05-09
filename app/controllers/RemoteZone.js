var util = require('util');
var Zone = require('./Zone');

/**
 * @constructor
 */
function RemoteZone(controller, zone)
{
  Zone.call(this, controller, zone);
  
  this.currentState = 'remote/disconnected';
  this.interruptedProgram = null;
}

util.inherits(RemoteZone, Zone);

RemoteZone.STATE_NOT_CONNECTED = 0;
RemoteZone.STATE_CONNECTED = 1;
RemoteZone.STATE_PROGRAM_RUNNING = 2;
RemoteZone.STATE_PROGRAM_FINISHED = 3;
RemoteZone.STATE_PROGRAM_STOPPED = 4;
RemoteZone.STATE_DOWNLOADING = 5;

/**
 * @param {String} newStateName
 * @param {?Object} [options]
 * @param {?Function} [done]
 */
RemoteZone.prototype.changeState = function(newStateName, options, done)
{
  Zone.prototype.changeState.call(
    this, 'remote/' + newStateName, options, done
  );
};

/**
 * @param {Function} done
 */
RemoteZone.prototype.reset = function(done)
{
  var zone = this;

  zone.setRemoteState(RemoteZone.STATE_CONNECTED, function(err)
  {
    if (err)
    {
      done(err);
    }
    else
    {
      Zone.prototype.reset.call(zone, done);
    }
  })
};

/**
 * @param {Function} done
 */
RemoteZone.prototype.getRemoteState = function(done)
{
  this.controller.getRemoteState(done);
};

/**
 * @param {Number} remoteState
 * @param {Function} [done]
 */
RemoteZone.prototype.setRemoteState = function(remoteState, done)
{
  this.controller.setRemoteState(remoteState, done);
};

RemoteZone.prototype.remoteProgramStopped = function()
{
  if (!this.program)
  {
    return;
  }

  this.controller.sendMessage('programStopped', {
    zoneId: this.zone._id
  });

  this.program = null;
};

/**
 * @param {Object} remoteProgram
 * @param {Function} done
 */
RemoteZone.prototype.startRemoteProgram = function(remoteProgram, done)
{
  var zone = this;

  this.controller.startRemoteProgram(remoteProgram, function(err)
  {
    if (!err)
    {
      zone.program = remoteProgram;
      zone.program.manual = false;
    }

    done(err);
  });
};

/**
 * @param {Function} done
 */
RemoteZone.prototype.stopRemoteProgram = function(done)
{
  this.controller.stopRemoteProgram(done);
};

/**
 * @param {Function} listener
 */
RemoteZone.prototype.startRemoteStateMonitor = function(listener)
{
  this.controller.startRemoteStateMonitor(listener);
};

RemoteZone.prototype.stopRemoteStateMonitor = function()
{
  this.controller.stopRemoteStateMonitor();
};

module.exports = RemoteZone;
