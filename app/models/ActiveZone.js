var _ = require('underscore');
var mongoose = require('mongoose');

function ActiveZone(zone, initialState, done)
{
  this.startTime = Date.now();
  this.lastConnectTime = null;
  this.lastDisconnectTime = null;
  this.state = initialState;
  this.zone = {
    _id: zone._id,
    name: zone.name,
    program: zone.program,
    controllerInfo: zone.controllerInfo
  };
  this.program = null;
  this.progress = null;
  this.doesNeedReset = false;
  this.doesNeedPlugIn = false;
  this.historyEntry = null;

  this.fetchAssignedProgram(done);
}

ActiveZone.prototype.toJSON = function()
{
  return {
    startTime: this.startTime,
    lastConnectTime: this.lastConnectTime,
    lastDisconnectTime: this.lastDisconnectTime,
    state: this.state,
    _id: this.zone._id,
    name: this.zone.name,
    assignedProgram: this.zone.program,
    program: this.program,
    progress: this.progress,
    needsReset: this.doesNeedReset,
    needsPlugIn: this.doesNeedPlugIn,
    historyEntry: this.historyEntry ? this.historyEntry.id : null
  };
};

ActiveZone.prototype.connected = function(fromDisconnect)
{
  this.state = 'connected';

  if (fromDisconnect)
  {
    this.lastConnectTime = Date.now();
  }

  this.emitNewState({
    lastConnectTime: this.lastConnectTime
  });
};

ActiveZone.prototype.disconnected = function()
{
  this.state = 'disconnected';
  this.lastDisconnectTime = Date.now();

  this.emitNewState({
    lastDisconnectTime: this.lastDisconnectTime
  });
};

/**
 * @param {Program} program
 * @param {?Object} user
 */
ActiveZone.prototype.programRunning = function(program, user)
{
  this.state = 'programRunning';

  this.program = program.toObject();
  this.program.startTime = Date.now();
  this.program.startUser = user;

  this.historyEntry = new (mongoose.model('HistoryEntry'))({
    zoneId: this.zone._id,
    zoneName: this.zone.name,
    programId: program._id,
    programName: program.name,
    programSteps: program.steps,
    infinite: program.infinite,
    startUserId: user ? user._id : null,
    startUserName: user ? user.name : null,
    startedAt: new Date()
  });

  var activeZone = this;

  this.historyEntry.save(function(err, historyEntry)
  {
    activeZone.emitNewState({
      program: activeZone.program,
      historyEntry: historyEntry.id
    });
  });
};

ActiveZone.prototype.programFinished = function()
{
  this.state = 'programFinished';

  this.program.stopTime = Date.now();

  this.historyEntry.set({
    finishState: 'finish',
    finishedAt: new Date()
  });
  this.historyEntry.save();

  this.emitNewState({
    program: this.program
  });
};

ActiveZone.prototype.programStopped = function(user)
{
  this.state = 'programStopped';

  this.program.stopTime = Date.now();
  this.program.stopUser = user;

  this.historyEntry.set({
    finishState: 'stop',
    finishedAt: new Date(),
    stopUserId: user ? user._id : null,
    stopUserName: user ? user.name : null
  });
  this.historyEntry.save();

  this.emitNewState({
    program: this.program
  });
};

ActiveZone.prototype.programErrored = function(errorMessage)
{
  this.state = 'programErrored';

  this.program.stopTime = Date.now();
  this.program.errorMessage = errorMessage;

  this.historyEntry.set({
    finishState: 'error',
    finishedAt: new Date(),
    errorMessage: errorMessage
  });
  this.historyEntry.save();

  this.emitNewState({
    program: this.program
  });
};

ActiveZone.prototype.updateProgress = function(progress)
{
  this.progress = progress;

  this.emitState({progress: progress});
};

ActiveZone.prototype.needsReset = function()
{
  this.doesNeedReset = true;

  this.emitState({needsReset: true});
};

ActiveZone.prototype.wasReset = function()
{
  this.doesNeedReset = false;

  this.emitState({needsReset: false});
};

ActiveZone.prototype.needsPlugIn = function()
{
  this.doesNeedPlugIn = true;

  this.emitState({needsPlugIn: true});
};

ActiveZone.prototype.wasPlugIn = function()
{
  this.doesNeedPlugIn = false;

  this.emitState({needsPlugIn: false});
};

/**
 * @param {Program} [program]
 */
ActiveZone.prototype.programmed = function(program)
{
  this.zone.program = program ? program.toObject() : null;

  this.emitState({assignedProgram: this.zone.program});
};

/**
 * @private
 */
ActiveZone.prototype.fetchAssignedProgram = function(done)
{
  var zone = this.zone;

  if (zone.program === null)
  {
    return done();
  }

  app.db.model('Program').findById(zone.program, function(err, program)
  {
    if (program)
    {
      zone.program = program.toObject();
    }
    else
    {
      zone.program = null;
    }

    done();
  });
};

/**
 * @private
 * @param {Object} [data]
 */
ActiveZone.prototype.emitNewState = function(data)
{
  this.emitState(_.extend(data, {
    state: this.state
  }));
};

/**
 * @private
 * @param {Object} [data]
 */
ActiveZone.prototype.emitState = function(data)
{
  app.io.sockets.emit('zone state changed', _.extend(data, {
    _id: this.zone._id
  }));
};

module.exports = ActiveZone;
