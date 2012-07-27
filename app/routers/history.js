var step = require('step');
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

app.get('/history;stats', auth('stats'), function(req, res, next)
{
  var HistoryEntry = app.db.model('HistoryEntry');

  var reduceTotalTime = (function(entry, prev)
  {
    var finishTime = entry.finishedAt.getTime();
    var startTime = entry.startedAt.getTime();

    prev.totalTime += Math.round((finishTime - startTime) / 1000);
    prev.totalCount += 1;
  }).toString();

  var stats = {
    idToNameMap: {}
  };

  step(
    function groupProgramTotals()
    {
      var keys = ['programId', 'finishState', 'programName'];
      var condition = {finishState: {$exists: true}};
      var initial = {totalTime: 0, totalCount: 0};

      HistoryEntry.collection.group(
        keys, condition, initial, reduceTotalTime, this
      );
    },
    function assignProgramTotals(err, results)
    {
      if (err)
      {
        throw err;
      }

      stats.programCounts = {
        $total: {
          $total: 0,
          finish: 0,
          stop: 0,
          error: 0
        }
      };

      stats.programTimes = {
        $total: {
          $total: 0,
          finish: 0,
          stop: 0,
          error: 0
        }
      };

      results.forEach(function(result)
      {
        if (!stats.programTimes.hasOwnProperty(result.programId))
        {
          stats.idToNameMap[result.programId] = result.programName;

          stats.programCounts[result.programId] = {
            $total: 0,
            finish: 0,
            stop: 0,
            error: 0
          };

          stats.programTimes[result.programId] = {
            $total: 0,
            finish: 0,
            stop: 0,
            error: 0
          };
        }

        stats.programCounts[result.programId][result.finishState] =
          result.totalCount;
        stats.programCounts[result.programId].$total += result.totalCount;
        stats.programCounts.$total[result.finishState] += result.totalCount;
        stats.programCounts.$total.$total += result.totalCount;

        stats.programTimes[result.programId][result.finishState] =
          result.totalTime;
        stats.programTimes[result.programId].$total += result.totalTime;
        stats.programTimes.$total[result.finishState] += result.totalTime;
        stats.programTimes.$total.$total += result.totalTime;
      });

      return true;
    },
    function groupTotalTimesByZone()
    {
      var keys = ['zoneId', 'finishState', 'zoneName'];
      var condition = {finishState: {$exists: true}};
      var initial = {totalTime: 0, totalCount: 0};

      HistoryEntry.collection.group(
        keys, condition, initial, reduceTotalTime, this
      );
    },
    function assignTotalTimesByZone(err, results)
    {
      if (err)
      {
        throw err;
      }

      stats.zoneTimes = {
        $total: {
          $total: 0,
          finish: 0,
          stop: 0,
          error: 0
        }
      };

      results.forEach(function(result)
      {
        if (!stats.zoneTimes.hasOwnProperty(result.zoneId))
        {
          stats.idToNameMap[result.zoneId] = result.zoneName;

          stats.zoneTimes[result.zoneId] = {
            $total: 0,
            finish: 0,
            stop: 0,
            error: 0
          };
        }

        stats.zoneTimes[result.zoneId][result.finishState] = result.totalTime;
        stats.zoneTimes[result.zoneId].$total += result.totalTime;
        stats.zoneTimes.$total[result.finishState] += result.totalTime;
        stats.zoneTimes.$total.$total += result.totalTime;
      });

      return true;
    },
    function sendResponse(err)
    {
      if (err)
      {
        return next(err);
      }

      res.send(stats);
    }
  );
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
