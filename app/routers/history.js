var auth = require('../utils/middleware').auth;

app.get('/history', auth('viewHistory'), function(req, res, next)
{
  var HistoryEntry = app.db.model('HistoryEntry');

  var conditions = req.query.conditions || {};
  var fields = req.query.fields;
  var page = (parseInt(req.query.page) || 1) - 1;
  var limit = parseInt(req.query.limit) || 10;

  HistoryEntry.count(conditions, function(err, totalCount)
  {
    if (err)
    {
      return next(err);
    }

    function send(data)
    {
      res.send({
        page: page + 1,
        limit: limit,
        pages: Math.ceil(totalCount / limit),
        totalCount: totalCount,
        data: data
      });
    }

    if (totalCount === 0)
    {
      return send([]);
    }

    var query = HistoryEntry.find(conditions, fields);

    query.exists('finishState');
    query.desc('finishedAt');
    query.limit(limit);
    query.skip(limit * page);

    query.run(function(err, docs)
    {
      if (err)
      {
        return next(err);
      }

      send(docs);
    });
  });
});

app.get('/history;page', auth('viewHistory'), function(req, res, next)
{
  var Program = app.db.model('Program');

  Program.find({}, {name: 1}).asc('name').run(function(err, programs)
  {
    if (err)
    {
      return next(err);
    }

    var Zone = app.db.model('Zone');

    Zone.find({}, {name: 1}).asc('name').run(function(err, zones)
    {
      if (err)
      {
        return next(err);
      }

      res.send({
        programs: programs,
        zones: zones
      });
    });
  });
});

app.get('/history/:id', auth('viewHistory'), function(req, res, next)
{
  var HistoryEntry = app.db.model('HistoryEntry');

  HistoryEntry.findById(req.params.id, function(err, doc)
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

app.del('/history', auth('purgeHistory'), function(req, res, next)
{
  var age = parseInt(req.body.age);

  if (isNaN(age))
  {
    return res.send(400);
  }

  var msInDay = 24 * 3600 * 1000;
  var timeAgo = Date.now() - age * msInDay;

  var HistoryEntry = app.db.model('HistoryEntry');

  HistoryEntry.remove({startedAt: {$lt: new Date(timeAgo)}}, function(err)
  {
    if (err)
    {
      return next(err);
    }

    res.send();
  });
});
