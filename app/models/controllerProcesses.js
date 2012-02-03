var ControllerProcess = require('./ControllerProcess');

var controllerProcesses = {};
var zoneToControllerMap = {};

exports.isControllerStarted = function(controllerId)
{
  return controllerId in controllerProcesses;
};

exports.startController = function(controller, done)
{
  if (exports.isControllerStarted(controller.id))
  {
    return done();
  }

  var controllerProcess = new ControllerProcess(controller);

  controllerProcess.startController(function(err)
  {
    if (err)
    {
      return done(err);
    }

    controllerProcesses[controller.id] = controllerProcess;

    done();
  });
};

exports.stopController = function(controllerId, done)
{
  var controllerProcess = controllerProcesses[controllerId];

  if (!controllerProcess)
  {
    return done();
  }

  controllerProcess.stopController(function(err)
  {
    if (err)
    {
      return done(err);
    }

    delete controllerProcesses[controllerId];

    for (var zoneId in zoneToControllerMap)
    {
      if (zoneToControllerMap[zoneId] === controllerId)
      {
        delete zoneToControllerMap[zoneId];
      }
    }

    done();
  });
};

exports.isZoneStarted = function(zoneId)
{
  return zoneId in zoneToControllerMap;
};

exports.startZone = function(zone, done)
{
  var controllerId = (zone.controller || '').toString();

  if (exports.isZoneStarted(zone.id))
  {
    return done();
  }

  var controllerProcess = controllerProcesses[controllerId];

  if (!controllerProcess)
  {
    return done("Sterownik strefy nie jest uruchomiony :(");
  }

  controllerProcess.startZone(zone, function(err)
  {
    if (err)
    {
      return done(err);
    }

    zoneToControllerMap[zone.id] = controllerId;

    done();
  });
};

exports.stopZone = function(zoneId, done)
{
  var controllerId = zoneToControllerMap[zoneId];

  if (!controllerId)
  {
    return done();
  }

  var controllerProcess = controllerProcesses[controllerId];

  controllerProcess.stopZone(zoneId, function(err)
  {
    if (err)
    {
      return done(err);
    }

    delete zoneToControllerMap[zoneId];

    done();
  });
};

exports.startProgram = function(program, zoneId, user, onFinish, done)
{
  var controllerId = zoneToControllerMap[zoneId];

  if (!controllerId)
  {
    return done("Strefa nie jest uruchomiona :(");
  }

  var controllerProcess = controllerProcesses[controllerId];

  controllerProcess.startProgram(program, zoneId, user, onFinish, done);
};

exports.stopProgram = function(zoneId, done)
{
  var controllerId = zoneToControllerMap[zoneId];

  if (!controllerId)
  {
    return done();
  }

  var controllerProcess = controllerProcesses[controllerId];

  controllerProcess.stopProgram(zoneId, done);
};

exports.getStartedControllers = function()
{
  var controllers = {};

  for (var controllerId in controllerProcesses)
  {
    controllers[controllerId] = controllerProcesses[controllerId].controller;
  }

  return controllers;
};

exports.getStartedZones = function()
{
  var zones = {};

  for (var zoneId in zoneToControllerMap)
  {
    var controllerProcess = controllerProcesses[zoneToControllerMap[zoneId]];

    zones[zoneId] = controllerProcess.zones[zoneId];
  }

  return zones;
};
