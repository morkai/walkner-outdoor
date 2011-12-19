
var ControllerProcess = module.exports = function(forkedProcess)
{
  this.process    = forkedProcess;
  this.requests   = {};
  this.zoneStates = {};

  this.process.on('exit', this.onExit.bind(this));
  this.process.on('message', this.onMessage.bind(this));
};

ControllerProcess.prototype.send = function(type, data, cb)
{
  var requestId = Math.random().toString();

  this.process.send({
    id  : requestId,
    type: type,
    data: data
  });

  if (cb)
  {
    this.requests[requestId] = cb;
  }
};

ControllerProcess.prototype.initialize = function(connectionInfo, cb)
{
  var self = this;

  this.send('initialize', connectionInfo, function(err) { cb(err, self); });
};

ControllerProcess.prototype.startZone = function(zoneState, cb)
{
  var self = this;

  this.send('startZone', zoneState.toControllerObject(), function(err)
  {
    if (!err)
    {
      self.zoneStates[zoneState.zoneId] = zoneState;
    }

    cb(err);
  });
};

ControllerProcess.prototype.stopZone = function(zoneId, cb)
{
  var self      = this;
  var zoneState = this.zoneStates[zoneId];

  if (!zoneState) return cb();

  this.send('stopZone', zoneId, function(err)
  {
    delete self.zoneStates[zoneId];

    cb(err);
  });
};

ControllerProcess.prototype.onExit = function(code, signal)
{
  for (var zoneId in this.zoneStates)
  {
    var zoneState = this.zoneStates[zoneId];

    delete this.zoneStates[zoneId];

    zoneState.stopped('Zamknięcie procesu sterownika.');
  }
};

ControllerProcess.prototype.onMessage = function(message)
{
  if (message.id && message.id in this.requests)
  {
    this.requests[message.id](message.data);
  }
  else if (message.type in ControllerProcess.messageHandlers)
  {
    ControllerProcess.messageHandlers[message.type].call(this, message.data);
  }
};

ControllerProcess.messageHandlers = {

  zoneFinished: function(message)
  {
    var zoneState = this.zoneStates[message.zoneId];

    if (!zoneState) return;

    delete this.zoneStates[message.zoneId];

    zoneState.stopped(message.error);
  }

};