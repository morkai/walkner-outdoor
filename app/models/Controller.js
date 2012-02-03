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

Controller.statics.startAll = function(done)
{
  mongoose.model('Controller').find().run(function(err, controllers)
  {
    if (err)
    {
      return done(err);
    }

    var controllersToStart = controllers.length;
    var startedControllers = 0;

    if (controllersToStart === 0)
    {
      return done();
    }

    controllers.forEach(function(controller)
    {
      controller.start(function(err)
      {
        if (err)
        {
          console.debug(
            'Starting controller <%s> failed: %s',
            controller.name,
            err.message || err
          );
        }

        if (++startedControllers === controllersToStart)
        {
          return done();
        }
      });
    });
  });
};

Controller.methods.isStarted = function()
{
  return controllerProcesses.isControllerStarted(this.id);
};

Controller.methods.start = function(done)
{
  controllerProcesses.startController(this, done);
};

Controller.methods.stop = function(done)
{
  controllerProcesses.stopController(this.id, done);
};

mongoose.model('Controller', Controller);
