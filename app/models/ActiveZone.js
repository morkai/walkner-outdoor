// Copyright (c) 2014, Łukasz Walukiewicz <lukasz@walukiewicz.eu>. Some Rights Reserved.
// Licensed under CC BY-NC-SA 4.0 <http://creativecommons.org/licenses/by-nc-sa/4.0/>.
// Part of the walkner-outdoor project <http://lukasz.walukiewicz.eu/p/walkner-outdoor>

var util = require('util');
var EventEmitter = require('events').EventEmitter;
var _ = require('underscore');
var mongoose = require('mongoose');
var calcRemainingTime = require('../utils/program').calcRemainingTime;

/**
 * @constructor
 * @extends {EventEmitter}
 * @param {Zone} zone
 * @param {String} initialState
 * @param {Function} done
 */
function ActiveZone(zone, initialState, done)
{
  EventEmitter.call(this);

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

util.inherits(ActiveZone, EventEmitter);

ActiveZone.prototype.destroy = function()
{
  this.removeAllListeners();
};

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
    historyEntry: this.historyEntry ? this.historyEntry._id : null
  };
};

ActiveZone.prototype.connected = function(fromDisconnect)
{
  if (fromDisconnect)
  {
    this.lastConnectTime = Date.now();
  }
  else
  {
    this.program = null;
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
 * @param {Number} [startOffset]
 */
ActiveZone.prototype.programRunning = function(program, user, startOffset)
{
  this.program = program.toObject();
  this.program.startTime = Date.now();
  this.program.startUser = user;

  if (startOffset)
  {
    this.program.startTime -= startOffset * 1000;
  }

  this.historyEntry = new (mongoose.model('HistoryEntry'))({
    zoneId: this.zone._id,
    zoneName: this.zone.name,
    programId: program._id,
    programName: program.name,
    programSteps: program.steps,
    infinite: program.infinite,
    startUserId: user ? user._id : null,
    startUserName: user ? user.name : null,
    startedAt: new Date(this.program.startTime)
  });

  var activeZone = this;

  this.historyEntry.save(function(err, historyEntry)
  {
    activeZone.emitNewState('programRunning', {
      program: activeZone.program,
      historyEntry: historyEntry._id
    });
  });

  console.info(
    'Program [%s] was started on zone [%s].',
    this.program.name,
    this.zone.name
  );
};

/**
 * @param {RemoteState} remoteState
 */
ActiveZone.prototype.remoteProgramRunning = function(remoteState)
{
  if (this.program && this.program._id.toString() === remoteState.programId)
  {
    this.handleInterruptedProgram(remoteState);
  }
  else
  {
    this.handleUnknownProgram(remoteState);
  }
};

/**
 * @param {Boolean} remote
 */
ActiveZone.prototype.programFinished = function(remote)
{
  if (this.state !== 'programRunning')
  {
    return console.error(
      'Ignoring a change of state from [%s] to [programFinished] on active zone [%s].',
      this.state,
      this.zone.name
    );
  }

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

/**
 * @param {?Object} user
 */
ActiveZone.prototype.programStopped = function(user)
{
  if (this.state !== 'programRunning')
  {
    return console.error(
      'Ignoring a change of state from [%s] to [programStopped] on active zone [%s].',
      this.state,
      this.zone.name
    );
  }

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

/**
 * @param {String} errorMessage
 */
ActiveZone.prototype.programErrored = function(errorMessage)
{
  if (this.state !== 'programRunning')
  {
    return console.error(
      'Ignoring a change of state from [%s] to [programErrored] on active zone [%s].',
      this.state,
      this.zone.name
    );
  }

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

/**
 * @param {Object} progress
 */
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
  var zone = this.zone;

  zone.program = program ? program.toObject() : null;

  this.emitState({assignedProgram: zone.program});

  this.emit('programmed', zone._id, zone.program);
};

/**
 * @param {String} programId
 * @param {Number} interruptTime
 */
ActiveZone.prototype.markProgramAsInterrupted = function(programId, interruptTime)
{
  if (this.historyEntry === null || this.historyEntry.get('programId').toString() !== programId)
  {
    return;
  }

  this.historyEntry.set({
    finishState: 'error',
    finishedAt: interruptTime,
    errorMessage: 'Nieoczekiwany restart sterownika.'
  });
  this.historyEntry.save();
  this.historyEntry = null;
};

/**
 * @private
 * @param {Function} done
 */
ActiveZone.prototype.fetchAssignedProgram = function(done)
{
  var activeZone = this;
  var zone = activeZone.zone;

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

    process.nextTick(function()
    {
      activeZone.emit('programmed', zone._id, zone.program);
    });
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

/**
 * @private
 * @param {RemoteState} remoteState
 */
ActiveZone.prototype.handleInterruptedProgram = function(remoteState)
{
  this.emitNewState('programRunning', {
    program: this.program
  });
};

/**
 * @private
 * @param {RemoteState} remoteState
 */
ActiveZone.prototype.handleUnknownProgram = function(remoteState)
{
  var activeZone = this;

  app.db.model('Program').findById(remoteState.programId, function(err, program)
  {
    if (err)
    {
      throw err;
    }

    var totalTime = program.totalTime;
    var remainingTime = calcRemainingTime(program, remoteState);
    var elapsedTime = totalTime - remainingTime;

    activeZone.programRunning(program, null, elapsedTime);
  });
};

module.exports = ActiveZone;
