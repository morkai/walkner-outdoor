var _ = require('underscore');

var ZoneState = module.exports = function(zone, program, onStop)
{
  this.zoneId         = zone.get('id');
  this.programName    = program.get('name');
  this.steps          = program.get('steps');
  this.infinite       = program.get('infinite');
  this.totalTime      = program.get('totalTime');
  this.controllerInfo = zone.get('controllerInfo') || {};

  if (this.steps.length === 0 || this.totalTime === 0)
  {
    throw 'Wybrany program nie ma zdefiniowanych żadnych kroków.';
  }

  this.onStop    = onStop;
  this.error     = null;
  this.startTime = null;
  this.stopTime  = null;
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

    totalTime: this.totalTime
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
};

ZoneState.prototype.stopped = function(err)
{
  this.error    = err;
  this.stopTime = Date.now();

  if (typeof this.onStop === 'function')
  {
    this.onStop();
  }
};
