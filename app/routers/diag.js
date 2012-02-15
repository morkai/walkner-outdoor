var os = require('os');
var _ = require('underscore');
var step = require('step');
var auth = require('../utils/middleware').auth;
var controllerProcesses = require('../models/controllerProcesses');

app.get('/diag', auth('diag'), function(req, res, next)
{
  var Controller = app.db.model('Controller');
  var Zone = app.db.model('Zone');

  var data = {startTime: app.startTime, eth0: [], wlan0: []};

  step(
    function getIpAddressesStep()
    {
      _.each(os.networkInterfaces(), function(addresses, iface)
      {
        if (iface === 'eth0' || iface.indexOf('Local') === 0)
        {
          _.each(addresses, function(address)
          {
            if (address.family === 'IPv4' && !address.interval)
            {
              data.eth0.push(address.address);
            }
          });
        }
        else if (iface === 'wlan0' || iface.indexOf('Wireless') === 0)
        {
          _.each(addresses, function(address)
          {
            if (address.family === 'IPv4' && !address.interval)
            {
              data.wlan0.push(address.address);
            }
          });
        }
      });

      return true;
    },
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
      var controllers = data.controllers = [];

      allControllers.forEach(function(controller)
      {
        var online = controller._id in startedControllers;

        if (online)
        {
          controller = startedControllers[controller._id];
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
      var zones = data.zones = [];

      allZones.forEach(function(zone)
      {
        var online = zone._id in startedZones;

        if (online)
        {
          var controllerId = zone.controller;

          zone = startedZones[zone._id];
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

      data.programs = controllerProcesses.getStartedPrograms();

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
