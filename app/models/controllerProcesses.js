var fork              = require('child_process').fork;
var ControllerProcess = require('./ControllerProcess');

var controllerProcesses = {};

function initialize(controller, cb)
{
  var controllerFile    = __dirname + '/../controllers/' + controller.get('type') + '.js';
  var forkedProcess     = fork(controllerFile, [], {env: process.env});
  var controllerProcess = new ControllerProcess(forkedProcess);

  controllerProcess.initialize(controller.get('connectionInfo'), cb);
}

exports.start = function(controller, zoneState, cb)
{
  var controllerId = controller.get('id');

  if (controllerId in controllerProcesses)
  {
    controllerProcesses[controllerId].startZone(zoneState, cb);
  }
  else
  {
    initialize(controller, function(err, controllerProcess)
    {
      if (err) return cb(err);

      controllerProcesses[controllerId] = controllerProcess;

      controllerProcess.startZone(zoneState, cb);
    });
  }
};

exports.stop = function(controller, zoneId, cb)
{
  var controllerProcess = controllerProcesses[controller.get('id')];

  if (controllerProcess)
  {
    controllerProcess.stopZone(zoneId, cb);
  }
  else
  {
    cb(null);
  }
};
