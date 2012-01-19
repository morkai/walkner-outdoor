var ControllerProcess = require('./ControllerProcess');

var controllerProcesses = {};
var zoneToControllerMap = {};

exports.startController = function(controller, done)
{
  if (controller.id in controllerProcesses)
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

exports.stopController = function(controller, done)
{
  var controllerProcess = controllerProcesses[controller.id];

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

    delete controllerProcesses[controller.id];

    for (var zoneId in zoneToControllerMap)
    {
      if (zoneToControllerMap[zoneId] === controller.id)
      {
        delete zoneToControllerMap[zoneId];
      }
    }

    done();
  });
};

exports.startZone = function(zone, done)
{
  var controllerId = (zone.controller || '').toString();

  if (controllerId in zoneToControllerMap)
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
