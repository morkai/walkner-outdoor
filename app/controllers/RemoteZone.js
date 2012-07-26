var util = require('util');
var Zone = require('./Zone');

var EMPTY_PROGRAM = {
  _id: '1234567890abcdef12345678',
  name: 'NULL',
  infinite: false,
  steps: []
};

/**
 * @constructor
 * @param {Controller} controller
 * @param {Object} zone
 */
function RemoteZone(controller, zone)
{
  Zone.call(this, controller, zone);

  /**
   * @type {String}
   */
  this.currentState = 'remote/disconnected';

  /**
   * @type {?Object}
   */
  this.interruptedProgram = null;

  /**
   * @type {?Object}
   */
  this.assignedProgram = null;

  /**
   * @type {Boolean}
   */
  this.shouldUploadAssignedProgram = false;

  /**
   * @type {Boolean}
   */
  this.progressUpdated = false;
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
 * @param {?Object} assignedProgram
 * @param {Function} done
 */
RemoteZone.prototype.assignProgram = function(assignedProgram, done)
{
  this.shouldUploadAssignedProgram = true;
  this.assignedProgram = assignedProgram ? assignedProgram : EMPTY_PROGRAM;

  console.debug(
    "Assigned program [%s] to zone [%s].",
    this.assignedProgram.name,
    this.zone.name
  );

  done();
};

/**
 * @param {Function} [done]
 */
RemoteZone.prototype.uploadAssignedProgram = function(done)
{
  var remoteZone = this;

  if (!remoteZone.shouldUploadAssignedProgram || !remoteZone.assignedProgram)
  {
    return done && done();
  }

  remoteZone.shouldUploadAssignedProgram = false;

  remoteZone.controller.program(remoteZone.assignedProgram, function(err)
  {
    if (err)
    {
      remoteZone.shouldUploadAssignedProgram = true;

      console.error(
        "Failed to upload assigned program [%s] to zone [%s].",
        remoteZone.assignedProgram.name,
        remoteZone.zone.name
      );
    }
    else
    {
      console.debug(
        "Uploaded assigned program [%s] to zone [%s].",
        remoteZone.assignedProgram.name,
        remoteZone.zone.name
      );
    }

    done && done(err);
  });
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

/**
 * @param {RemoteState} remoteState
 */
RemoteZone.prototype.remoteProgramRunning = function(remoteState)
{
  this.controller.sendMessage('remoteProgramRunning', {
    zoneId: this.zone._id,
    remoteState: remoteState
  });
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

/**
 * @constructor
 */
function RemoteState()
{
  /**
   * @type {Number}
   */
  this.code = 0;

  /**
   * @type {Number}
   */
  this.stepIndex = 0;

  /**
   * @type {Number}
   */
  this.stepIteration = 0;

  /**
   * @type {Number}
   */
  this.stepState = 0;

  /**
   * @type {Number}
   */
  this.elapsedTime = 0;

  /**
   * @type {String}
   */
  this.programId = null;
}

module.exports = RemoteZone;
