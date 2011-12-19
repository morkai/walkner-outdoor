var Program = require('../models/Program');

app.get('/programs', function(req, res, next)
{
  Program.find({}, req.query.fields, function(err, docs)
  {
    if (err) return next(err);

    res.send(docs);
  });
});

app.post('/programs', function(req, res, next)
{
  var program = new Program(req.body);

  program.save(function(err)
  {
    if (err) return next(err);

    res.send(program, 201);
  });
});

app.get('/programs/:id', function(req, res, next)
{
  Program.findById(req.params.id, function(err, doc)
  {
    if (err) return next(err);

    if (!doc) return res.send(404);

    res.send(doc);
  });
});

app.put('/programs/:id', function(req, res, next)
{
  delete req.body._id;

  Program.update({_id: req.params.id}, req.body, function(err, count)
  {
    if (err) return next(err);

    if (!count) return res.send(404);

    res.send(204);
  });
});

app.del('/programs/:id', function(req, res, next)
{
  Program.remove({_id: req.params.id}, function(err)
  {
    if (err) return next(err);

    res.send(204);
  });
});
