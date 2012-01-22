var _                   = require('underscore');
var step                = require('step');
var auth                = require('../utils/middleware').auth;
var controllerProcesses = require('../models/controllerProcesses');

app.get('/diag', auth('diag'), function(req, res, next)
{
  var Controller = app.db.model('Controller');
  var Zone       = app.db.model('Zone');

  var data = {startTime: app.startTime};

  step(
    function getAllControllersStep()
    {
      Controller.find().asc('name').run(this);
    },
    function setControllersStep(err, allControllers)
    {
      if (err)
      {
        throw err;
      }

      var startedControllers = controllerProcesses.getStartedControllers();
      var controllers        = data.controllers = [];

      allControllers.forEach(function(controller)
      {
        var online = controller.id in startedControllers;

        if (online)
        {
          controller = startedControllers[controller.id];
        }
        else
        {
          controller = controller.toJSON();
        }

        controller.online = online;

        controllers.push(controller);
      });

      return true;
    },
    function getAllZonesStep(err)
    {
      if (err)
      {
        throw err;
      }

      Zone.find().asc('name').run(this);
    },
    function setZonesStep(err, allZones)
    {
      if (err)
      {
        throw err;
      }

      var startedZones = controllerProcesses.getStartedZones();
      var zones        = data.zones = [];

      allZones.forEach(function(zone)
      {
        var online = zone.id in startedZones;

        if (online)
        {
          var controllerId = zone.controller;

          zone            = startedZones[zone.id];
          zone.controller = controllerId;
        }
        else
        {
          zone = zone.toJSON();
        }

        zone.online = online;

        zones.push(zone);
      });

      return true;
    },
    function setProgramsStep(err)
    {
      if (err)
      {
        throw err;
      }

      var programs = data.programs = [];

      _.each(Zone.getStartedPrograms(), function(historyEntry)
      {
        var historyEntry = historyEntry.toJSON();

        programs.push(historyEntry);
      });

      return true;
    },
    function sendResponseStep(err)
    {
      if (err)
      {
        next(err);
      }
      else
      {
        res.send(data);
      }
    }
  );
});
