var HistoryEntry = require('../models/HistoryEntry');
var auth         = require('../utils/middleware').auth;

app.get('/history', auth('viewHistory'), function(req, res, next)
{
  var page  = parseInt(req.query.page || 1) - 1;
  var limit = 10;
  var query = HistoryEntry.find({}, req.query.fields);

  query.exists('finishState');
  query.desc('finishedAt');
  query.limit(limit);
  query.skip(limit * page);

  query.run(function(err, docs)
  {
    if (err) return next(err);

    res.send(docs);
  });
});

app.get('/history/:id', auth('viewHistory'), function(req, res, next)
{
  HistoryEntry.findById(req.params.id, function(err, doc)
  {
    if (err) return next(err);

    if (!doc) return res.send(404);

    res.send(doc);
  });
});