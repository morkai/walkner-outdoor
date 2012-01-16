var mongoose            = require('mongoose');
var controllerProcesses = require('./controllerProcesses');

var Controller = module.exports = new mongoose.Schema({
  name: {
    type    : String,
    required: true,
    trim    : true
  },
  type: {
    type    : String,
    required: true,
    enum    : ['modbus-tcp', 'libcoap']
  },
  connectionInfo: {}
}, {
  strict: true
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

mongoose.model('Controller', Controller);
