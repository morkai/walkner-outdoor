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
  if (fromDisconnect)
  {
    this.lastConnectTime = Date.now();
  }

  this.emitNewState('connected', {
    lastConnectTime: this.lastConnectTime
  });

  if (fromDisconnect)
  {
    console.debug('Zone [%s] connected to its controller.', this.zone.name);
  }
};

ActiveZone.prototype.disconnected = function()
{
  this.lastDisconnectTime = Date.now();

  this.emitNewState('disconnected', {
    lastDisconnectTime: this.lastDisconnectTime
  });

  console.debug('Zone [%s] disconnected from its controller.', this.zone.name);
};

/**
 * @param {Program} program
 * @param {Object} [user]
 */
ActiveZone.prototype.programRunning = function(program, user)
{
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
    activeZone.emitNewState('programRunning', {
      program: activeZone.program,
      historyEntry: historyEntry.id
    });
  });

  console.info(
    'Program [%s] was started on zone [%s].',
    this.program.name,
    this.zone.name
  );
};

/**
 * @param {Boolean} remote
 */
ActiveZone.prototype.programFinished = function(remote)
{
  this.program.stopTime = remote
    ? this.program.startTime + this.program.totalTime * 1000
    : Date.now();

  this.historyEntry.set({
    finishState: 'finish',
    finishedAt: new Date(this.program.stopTime)
  });
  this.historyEntry.save();

  this.emitNewState('programFinished', {
    program: this.program
  });

  console.info(
    'Program [%s] on zone [%s] finished successfully.',
    this.program.name,
    this.zone.name
  );
};

ActiveZone.prototype.programStopped = function(user)
{
  this.program.stopTime = Date.now();
  this.program.stopUser = user;

  this.historyEntry.set({
    finishState: 'stop',
    finishedAt: new Date(this.program.stopTime),
    stopUserId: user ? user._id : null,
    stopUserName: user ? user.name : null
  });
  this.historyEntry.save();

  this.emitNewState('programStopped', {
    program: this.program
  });

  console.info(
    'Program [%s] on zone [%s] was stopped by a user%s.',
    this.program.name,
    this.zone.name,
    user ? (': ' + user.name) : ' manually'
  );
};

ActiveZone.prototype.programErrored = function(errorMessage)
{
  this.program.stopTime = Date.now();
  this.program.errorMessage = errorMessage;

  this.historyEntry.set({
    finishState: 'error',
    finishedAt: new Date(),
    errorMessage: errorMessage
  });
  this.historyEntry.save();

  this.emitNewState('programErrored', {
    program: this.program
  });

  console.info(
    'Program [%s] on zone [%s] stopped with an error: %s',
    this.program.name,
    this.zone.name,
    errorMessage
  );
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

  console.debug('Zone [%s] needs a reset.', this.zone.name);
};

ActiveZone.prototype.wasReset = function()
{
  this.doesNeedReset = false;

  this.emitState({needsReset: false});

  console.debug('Zone [%s] was reset.', this.zone.name);
};

ActiveZone.prototype.needsPlugIn = function()
{
  this.doesNeedPlugIn = true;

  this.emitState({needsPlugIn: true});

  console.debug('Zone [%s] cart was unplugged.', this.zone.name);
};

ActiveZone.prototype.wasPlugIn = function()
{
  this.doesNeedPlugIn = false;

  this.emitState({needsPlugIn: false});

  console.debug('Zone [%s] cart was plugged in.', this.zone.name);
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
 * @param {String} newState
 * @param {Object} [data]
 */
ActiveZone.prototype.emitNewState = function(newState, data)
{
  this.state = newState;

  this.emitState(_.extend(data, {
    state: newState
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
