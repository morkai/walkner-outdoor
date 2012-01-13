var _        = require('underscore');
var mongoose = require('mongoose');

var ZoneState = module.exports = function(zone, program, startUser, onStop)
{
  this.steps     = program.get('steps');
  this.totalTime = program.get('totalTime');

  if (this.steps.length === 0 || this.totalTime === 0)
  {
    throw 'Wybrany program nie ma zdefiniowanych żadnych kroków.';
  }

  this.zoneId         = zone.get('id');
  this.zoneName       = zone.get('name');
  this.programId      = program.get('id');
  this.programName    = program.get('name');
  this.infinite       = program.get('infinite');
  this.controllerInfo = zone.get('controllerInfo') || {};
  this.startUser      = startUser;

  this.onStop      = onStop;
  this.error       = null;
  this.startTime   = null;
  this.stopTime    = null;
  this.historyId   = null;
  this.finishState = null;
};

ZoneState.prototype.destroy = function()
{
  for (var property in this)
  {
    delete this[property];
  }
};

ZoneState.prototype.toControllerObject = function()
{
  return {
    zoneId        : this.zoneId,
    steps         : this.steps,
    infinite      : this.infinite,
    controllerInfo: this.controllerInfo,
    totalTime     : this.totalTime
  };
};

ZoneState.prototype.toClientObject = function()
{
  return {
    programName: this.programName,
    infinite   : this.infinite,
    totalTime  : this.totalTime,
    startTime  : this.startTime,
    error      : this.error
  };
};

ZoneState.prototype.started = function()
{
  this.startTime = Date.now();

  var self         = this;
  var HistoryEntry = mongoose.model('HistoryEntry');
  var historyEntry = new HistoryEntry({
    zoneId      : this.zoneId,
    zoneName    : this.zoneName,
    programId   : this.programId,
    programName : this.programName,
    programSteps: this.steps,
    startedAt   : new Date(this.startTime)
  });

  if (this.startUser)
  {
    historyEntry.set({
      startUserId  : this.startUser._id,
      startUserName: this.startUser.name
    });
  }

  historyEntry.save(function(err)
  {
    if (!err)
    {
      self.historyId = historyEntry.get('id');
    }
  });
};

ZoneState.prototype.stopped = function(user)
{
  this.stopTime = Date.now();

  mongoose.model('HistoryEntry').stopped(this.historyId, user);

  if (typeof this.onStop === 'function')
  {
    this.onStop();
  }
};

ZoneState.prototype.finished = function(err)
{
  this.error    = err;
  this.stopTime = Date.now();

  mongoose.model('HistoryEntry').finished(this.historyId, err);

  if (err)
  {
    console.debug(
      'Program <%s> failed on zone <%s>: %s',
      this.programName,
      this.zoneName,
      err
    );
  }
  else
  {
    console.debug(
      'Program <%s> finished on zone <%s>',
      this.programName,
      this.zoneName
    );
  }

  if (typeof this.onStop === 'function')
  {
    this.onStop();
  }
};
