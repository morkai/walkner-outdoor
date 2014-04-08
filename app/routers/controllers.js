// Copyright (c) 2014, Łukasz Walukiewicz <lukasz@walukiewicz.eu>. Some Rights Reserved.
// Licensed under CC BY-NC-SA 4.0 <http://creativecommons.org/licenses/by-nc-sa/4.0/>.
// Part of the walkner-outdoor project <http://lukasz.walukiewicz.eu/p/walkner-outdoor>

var auth = require('../utils/middleware').auth;

app.get('/controllers', auth('viewControllers'), function(req, res, next)
{
  var Controller = app.db.model('Controller');

  Controller.find({}, req.query.fields).asc('name').run(function(err, docs)
  {
    if (err)
    {
      return next(err);
    }

    res.send(docs);
  });
});

app.post('/controllers', auth('manageControllers'), function(req, res, next)
{
  var Controller = app.db.model('Controller');
  var controller = new Controller(req.body);

  controller.save(function(err)
  {
    if (err)
    {
      return next(err);
    }

    res.send(controller, 201);

    app.io.sockets.emit('controller added', controller.toJSON());
  });
});

app.get('/controllers/:id', auth('viewControllers'), function(req, res, next)
{
  var Controller = app.db.model('Controller');

  Controller.findById(req.params.id, function(err, doc)
  {
    if (err)
    {
      return next(err);
    }

    if (!doc)
    {
      return res.send(404);
    }

    res.send(doc);
  });
});

app.put('/controllers/:id', auth('manageControllers'), function(req, res, next)
{
  var controllerId = req.params.id;

  delete req.body._id;

  app.db.model('Controller').findById(controllerId, function(err, controller)
  {
    if (err)
    {
      return next(err);
    }

    if (!controller)
    {
      return res.send(404);
    }

    if (controller.isStarted())
    {
      return res.send('Nie można modyfikować uruchomionego sterownika :(', 400);
    }

    controller.set(req.body).save(function(err)
    {
      if (err)
      {
        return next(err);
      }

      res.send(204);

      app.io.sockets.emit(
        'controller changed', {_id: controllerId, changes: req.body}
      );
    });
  });
});

app.del('/controllers/:id', auth('manageControllers'), function(req, res, next)
{
  var controllerId = req.params.id;

  app.db.model('Controller').findById(controllerId, function(err, controller)
  {
    if (err)
    {
      return next(err);
    }

    if (!controller)
    {
      return res.send(404);
    }

    if (controller.isStarted())
    {
      return res.send('Nie można usuwać uruchomionego sterownika :(', 400);
    }

    controller.remove(function(err)
    {
      if (err)
      {
        return next(err);
      }

      res.send(204);

      app.io.sockets.emit('controller removed', controllerId);
    });
  });
});

app.post('/controllers/:id', auth('diag'), function(req, res, next)
{
  app.db.model('Controller').findById(req.params.id, function(err, controller)
  {
    if (err)
    {
      return next(err);
    }

    if (!controller)
    {
      return res.send(404);
    }

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
