// Copyright (c) 2014, Łukasz Walukiewicz <lukasz@walukiewicz.eu>. Some Rights Reserved.
// Licensed under CC BY-NC-SA 4.0 <http://creativecommons.org/licenses/by-nc-sa/4.0/>.
// Part of the walkner-outdoor project <http://lukasz.walukiewicz.eu/p/walkner-outdoor>

var mongoose = require('mongoose');
var controllerProcesses = require('./controllerProcesses');

var Controller = module.exports = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['modbus-tcp', 'libcoap', 'remote-libcoap', 'cf-proxy-08']
  },
  connectionInfo: {},
  autostart: {
    type: Boolean,
    'default': false
  }
}, {
  strict: true
});

Controller.statics.startAll = function(autostartOnly, done)
{
  var cond = {};

  if (autostartOnly)
  {
    cond.autostart = true;
  }

  mongoose.model('Controller').find(cond).run(function(err, controllers)
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
  return controllerProcesses.isControllerStarted(this._id);
};

Controller.methods.start = function(done)
{
  controllerProcesses.startController(this, done);
};

Controller.methods.stop = function(done)
{
  controllerProcesses.stopController(this._id, done);
};

mongoose.model('Controller', Controller);
