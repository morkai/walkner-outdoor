var auth = require('../utils/middleware').auth;

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
  });
});

app.del('/controllers/:id', auth('manageControllers'), function(req, res, next)
{
  var Controller = app.db.model('Controller');

  Controller.remove({_id: req.params.id}, function(err)
  {
    if (err) return next(err);

    res.send(204);
  });
});
