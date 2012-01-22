var auth                = require('../utils/middleware').auth;
var controllerProcesses = require('../models/controllerProcesses');

app.get('/controllers', auth('viewControllers'), function(req, res, next)
{
  var Controller = app.db.model('Controller');

  Controller.find({}, req.query.fields, function(err, docs)
  {
    if (err) return next(err);

    res.send(docs);
  });
});

app.post('/controllers', auth('manageControllers'), function(req, res, next)
{
  var Controller = app.db.model('Controller');
  var controller = new Controller(req.body);

  controller.save(function(err)
  {
    if (err) return next(err);

    res.send(controller, 201);

    app.io.sockets.emit('controller added', controller.toJSON());
  });
});

app.get('/controllers/:id', auth('viewControllers'), function(req, res, next)
{
  var Controller = app.db.model('Controller');

  Controller.findById(req.params.id, function(err, doc)
  {
    if (err) return next(err);

    if (!doc) return res.send(404);

    res.send(doc);
  });
});

app.put('/controllers/:id', auth('manageControllers'), function(req, res, next)
{
  delete req.body._id;

  var Controller = app.db.model('Controller');

  Controller.update({_id: req.params.id}, req.body, function(err, count)
  {
    if (err) return next(err);

    if (!count) return res.send(404);

    res.send(204);

    app.io.sockets.emit(
      'controller changed', {id: req.params.id, changes: req.body}
    );
  });
});

app.del('/controllers/:id', auth('manageControllers'), function(req, res, next)
{
  var Controller = app.db.model('Controller');

  Controller.remove({_id: req.params.id}, function(err)
  {
    if (err) return next(err);

    res.send(204);

    app.io.sockets.emit('controller removed', req.params.id);
  });
});

app.post('/controllers/:id', auth('diag'), function(req, res, next)
{
  app.db.model('Controller').findById(req.params.id, function(err, controller)
  {
    if (err) return next(err);

    if (!controller) return res.send(404);

    switch (req.body.action)
    {
      case 'start':
        startController(res, next, controller);
        break;

      case 'stop':
        stopController(res, next, controller);
        break;

      default:
        res.send(400);
    }
  });
});

function startController(res, next, controller)
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

      if (err instanceof Error)
      {
        next(err);
      }
      else
      {
        res.send(err, 400);
      }
    }
    else
    {
      console.debug('Started controller <%s>', controller.name);

      res.send(201);
    }
  });
}

function stopController(res, next, controller)
{
  controller.stop(function(err)
  {
    if (err)
    {
      console.debug(
        'Stopping controller <%s> failed: %s',
        controller.name,
        err.message || err
      );

      if (err instanceof Error)
      {
        next(err);
      }
      else
      {
        res.send(err, 400);
      }
    }
    else
    {
      console.debug('Stopped controller <%s>', controller.name);

      res.send(201);
    }
  });
}
