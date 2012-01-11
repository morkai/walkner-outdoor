var _          = require('underscore');
var step       = require('step');
var Zone       = require('../models/Zone');
var Controller = require('../models/Controller');
var Program    = require('../models/Program');
var limits     = require('../../config/limits');

app.get('/zones', function(req, res, next)
{
  Zone.find({}, req.query.fields).asc('name').run(function(err, docs)
  {
    if (err) return next(err);

    res.send(docs);
  });
});

app.post('/zones', function(req, res, next)
{
  Zone.count(function(err, count)
  {
    if (err) return next(err);

    if (count >= limits.maxZones)
    {
      return res.send(
        'Nie można dodać strefy. Maksymalna ilość stref została osiągnięta.',
        400
      );
    }

    var zone = new Zone(req.body);

    zone.save(function(err)
    {
      if (err) return next(err);

      res.send(zone, 201);
    });
  });
});

app.get('/zones/:id', function(req, res, next)
{
  step(
    function findZoneStep()
    {
      Zone.findById(req.params.id, this);
    },
    function findControllerStep(err, zone)
    {
      if (err) throw err;

      if (!zone) throw 404;

      var zone = zone.toJSON();
      var next = this;

      if (!zone.controller)
      {
        return next(null, zone);
      }

      Controller.findById(zone.controller, {name: 1, type: 1}, function(err, controller)
      {
        next(err, zone, controller);
      });
    },
    function findProgramStep(err, zone, controller)
    {
      if (err) throw err;

      zone.controller = controller ? controller.toJSON() : null;

      var next = this;

      if (!zone.program)
      {
        return next(null, zone);
      }

      Program.findById(zone.program, {name: 1}, function(err, program)
      {
        next(err, zone, program);
      });
    },
    function sendResponseStep(err, zone, program)
    {
      if (err === 404) return res.send(404);

      if (err) return next(err);

      zone.program = program ? program.toJSON() : null;

      res.send(zone);
    }
  );
});

app.post('/zones/:id', function(req, res, next)
{
  Zone.findById(req.params.id, function(err, zone)
  {
    if (err) return next(err);

    if (!zone) return res.send(404);

    switch (req.body.action)
    {
      case 'start':
        zone.start(req.body.program, function(err, state)
        {
          if (err)
          {
            var program = req.body.program;

            if (state)
            {
              program = state.programName || req.body.program;

              state.destroy();
            }

            console.debug(
              'Failed to start program <%s> on zone <%s>: %s',
              program,
              zone.get('name'),
              err
            );
          }
          else
          {
            console.debug(
              'Started program <%s> on zone <%s>',
              state.programName,
              zone.get('name')
            );
          }

          if (err instanceof Error) return next(err);

          if (err) return res.send(err, 500);

          res.send();
        });
        break;

      case 'stop':
        zone.stop(function(err)
        {
          if (err)
          {
            console.debug(
              'Failed to stop zone <%s>: %s',
              zone.get('name'),
              err
            );
          }
          else
          {
            console.debug('Stopped zone <%s>',zone.get('name'));
          }

          if (err instanceof Error) return next(err);

          if (err) return res.send(err, 500);

          res.send();
        });
        break;

      default:
        res.send(400);
    }
  });
});

app.put('/zones/:id', function(req, res, next)
{
  var data = req.body;

  delete data._id;

  if (_.isObject(data.controller))
  {
    data.controller = data.controller._id;
  }

  if (_.isObject(data.program))
  {
    data.program = data.program._id;
  }

  Zone.update({_id: req.params.id}, data, function(err, count)
  {
    if (err) return next(err);

    if (!count) return res.send(404);

    res.send(204);
  });
});

app.del('/zones/:id', function(req, res, next)
{
  Zone.remove({_id: req.params.id}, function(err)
  {
    if (err) return next(err);

    res.send(204);
  });
});
