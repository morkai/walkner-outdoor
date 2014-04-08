// Copyright (c) 2014, Łukasz Walukiewicz <lukasz@walukiewicz.eu>. Some Rights Reserved.
// Licensed under CC BY-NC-SA 4.0 <http://creativecommons.org/licenses/by-nc-sa/4.0/>.
// Part of the walkner-outdoor project <http://lukasz.walukiewicz.eu/p/walkner-outdoor>

var limits = require('../../config/limits');
var auth = require('../utils/middleware').auth;

app.get('/programs', auth('viewPrograms'), function(req, res, next)
{
  var Program = app.db.model('Program');

  Program.find({}, req.query.fields).asc('name').run(function(err, docs)
  {
    if (err)
    {
      return next(err);
    }

    res.send(docs);
  });
});

app.post('/programs', auth('managePrograms'), function(req, res, next)
{
  var Program = app.db.model('Program');

  Program.count(function(err, count)
  {
    if (err)
    {
      return next(err);
    }

    if (count >= limits.maxPrograms)
    {
      return res.send(
        'Nie można dodać programu. Maksymalna ilość programów została osiągnięta.',
        400
      );
    }

    var program = new Program(req.body);

    program.save(function(err)
    {
      if (err)
      {
        return next(err);
      }

      res.send(program, 201);
    });
  });
});

app.get('/programs/:id', auth('viewPrograms'), function(req, res, next)
{
  var Program = app.db.model('Program');

  Program.findById(req.params.id, function(err, doc)
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

app.put('/programs/:id', auth('managePrograms'), function(req, res, next)
{
  delete req.body._id;

  var Program = app.db.model('Program');

  Program.update({_id: req.params.id}, req.body, function(err, count)
  {
    if (err)
    {
      return next(err);
    }

    if (!count)
    {
      return res.send(404);
    }

    res.send(204);
  });
});

app.del('/programs/:id', auth('managePrograms'), function(req, res, next)
{
  var Program = app.db.model('Program');

  Program.remove({_id: req.params.id}, function(err)
  {
    if (err)
    {
      return next(err);
    }

    res.send(204);
  });
});
