var Zone       = require('../models/Zone');
var Controller = require('../models/Controller');

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
  var zone = new Zone(req.body);

  zone.save(function(err)
  {
    if (err) return next(err);

    res.send(zone, 201);
  });
});

app.get('/zones/:id', function(req, res, next)
{
  Zone.findById(req.params.id, function(err, zone)
  {
    if (err) return next(err);

    if (!zone) return res.send(404);

    var zone = zone.toJSON();

    Controller.findById(zone.controller, function(err, controller)
    {
      zone.controller = controller ? controller : null;

      res.send(zone);
    });
  });
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
          if (err instanceof Error) return next(err);

          if (err) return res.send(err, 500);

          res.send();
        });
        break;

      case 'stop':
        zone.stop(function(err)
        {
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
  delete req.body._id;

  Zone.update({_id: req.params.id}, req.body, function(err, count)
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
