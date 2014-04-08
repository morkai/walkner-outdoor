// Copyright (c) 2014, Łukasz Walukiewicz <lukasz@walukiewicz.eu>. Some Rights Reserved.
// Licensed under CC BY-NC-SA 4.0 <http://creativecommons.org/licenses/by-nc-sa/4.0/>.
// Part of the walkner-outdoor project <http://lukasz.walukiewicz.eu/p/walkner-outdoor>

var ControllerProcess = require('./ControllerProcess');

var controllerProcesses = {};
var zoneToControllerMap = {};

exports.isControllerStarted = function(controllerId)
{
  return controllerId in controllerProcesses;
};

exports.startController = function(controller, done)
{
  if (exports.isControllerStarted(controller._id))
  {
    return done();
  }

  var controllerProcess = new ControllerProcess(controller);

  controllerProcess.onCrash = onControllerProcessCrash;

  controllerProcess.startController(function(err)
  {
    if (err)
    {
      return done(err);
    }

    controllerProcesses[controller._id] = controllerProcess;

    done();
  });
};

function onControllerProcessCrash(controllerId)
{
  delete controllerProcesses[controllerId];
}

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
      if (zoneToControllerMap[zoneId] === controllerId.toString())
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

  if (exports.isZoneStarted(zone._id))
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

    zoneToControllerMap[zone._id] = controllerId;

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

exports.resetZone = function(zoneId, done)
{
  var controllerId = zoneToControllerMap[zoneId];

  if (!controllerId)
  {
    return done();
  }

  controllerProcesses[controllerId].resetZone(zoneId, done);
};

exports.startProgram = function(program, zoneId, user, done)
{
  var controllerId = zoneToControllerMap[zoneId];

  if (!controllerId)
  {
    return done("Strefa nie jest uruchomiona :(");
  }

  var controllerProcess = controllerProcesses[controllerId];

  controllerProcess.startProgram(program, zoneId, user, done);
};

exports.stopProgram = function(zoneId, user, done)
{
  var controllerId = zoneToControllerMap[zoneId];

  if (!controllerId)
  {
    return done();
  }

  var controllerProcess = controllerProcesses[controllerId];

  controllerProcess.stopProgram(zoneId, user, done);
};

exports.getStartedControllers = function()
{
  var controllers = {};

  for (var controllerId in controllerProcesses)
  {
    var controllerProcess = controllerProcesses[controllerId];

    if (!controllerProcess)
    {
      delete controllerProcesses[controllerId];
      continue;
    }

    controllers[controllerId] = controllerProcess.controller;
  }

  return controllers;
};

exports.getStartedZone = function(zoneId)
{
  var controllerId = zoneToControllerMap[zoneId];
  var controllerProcess = controllerProcesses[controllerId];

  if (!controllerProcess)
  {
    delete controllerProcesses[controllerId];
    return null;
  }

  var activeZone = controllerProcess.zones[zoneId];

  if (!activeZone)
  {
    delete controllerProcess.zones[zoneId];
    return null;
  }

  return activeZone;
};

exports.getStartedZones = function()
{
  var zones = {};

  for (var zoneId in zoneToControllerMap)
  {
    var controllerId = zoneToControllerMap[zoneId];
    var controllerProcess = controllerProcesses[controllerId];

    if (!controllerProcess)
    {
      delete controllerProcesses[controllerId];
      continue;
    }

    var activeZone = controllerProcess.zones[zoneId];

    if (!activeZone)
    {
      delete controllerProcess.zones[zoneId];
      continue;
    }

    zones[zoneId] = activeZone.toJSON();
    zones[zoneId].controller = controllerId;
  }

  return zones;
};

exports.getStartedPrograms = function()
{
  var historyEntries = [];

  for (var zoneId in zoneToControllerMap)
  {
    var controllerId = zoneToControllerMap[zoneId];
    var controllerProcess = controllerProcesses[controllerId];

    if (!controllerProcess)
    {
      delete controllerProcesses[controllerId];
      continue;
    }

    var activeZone = controllerProcess.zones[zoneId];

    if (!activeZone)
    {
      delete controllerProcess.zones[zoneId];
      continue;
    }

    if (activeZone.state !== 'programRunning' || !activeZone.historyEntry)
    {
      continue;
    }

    historyEntries.push(activeZone.historyEntry.toJSON());
  }

  return historyEntries;
};
