var mongoose          = require('mongoose');
var controllerProcesses = require('./controllerProcesses');

var Controller = new mongoose.Schema({
  name: {
    type    : String,
    required: true,
    trim    : true
  },
  type: {
    type    : String,
    required: true,
    enum    : ['modbus-tcp']
  },
  connectionInfo: {}
});

Controller.methods.start = function(zoneState, cb)
{
  controllerProcesses.start(
    this, zoneState, function(err)
    {
      if (!err)
      {
        zoneState.started();
      }

      cb(err, zoneState);
    }
  );
};

Controller.methods.stop = function(zoneId, cb)
{
  controllerProcesses.stop(this, zoneId, cb);
};

module.exports = mongoose.model('Controller', Controller);
