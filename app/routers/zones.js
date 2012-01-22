var _      = require('underscore');
var step   = require('step');
var limits = require('../../config/limits');
var auth   = require('../utils/middleware').auth;

app.get('/zones', function(req, res, next)
{
  var Zone = app.db.model('Zone');

  Zone.find({}, req.query.fields).asc('name').run(function(err, docs)
  {
    if (err) return next(err);

    res.send(docs);
  });
});

app.post('/zones', auth('manageZones'), function(req, res, next)
{
  var Zone = app.db.model('Zone');

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

      app.io.sockets.emit('zone added', zone);
    });
  });
});

app.get('/zones/:id', auth('viewZones'), function(req, res, next)
{
  step(
    function findZoneStep()
    {
      app.db.model('Zone').findById(req.params.id, this);
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

      var controllerId = zone.controller;
      var fields       = {name: 1, type: 1};

      app.db.model('Controller').findById(controllerId, fields).run(
        function(err, controller) { next(err, zone, controller); }
      );
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

      app.db.model('Program').findById(zone.program, {name: 1}).run(
        function(err, program) { next(err, zone, program); }
      );
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
  var action           = req.body.action;
  var actionPrivilages = {
    'startProgram': 'startStop',
    'stopProgram' : 'startStop',
    'start'       : 'diag',
    'stop'        : 'diag'
  };
  var actionPrivilage  = actionPrivilages[action];

  if (!actionPrivilage)
  {
    return res.send(400);
  }

  auth(actionPrivilage)(req, res, function()
  {
    app.db.model('Zone').findById(req.params.id, function(err, zone)
    {
      if (err) return next(err);

      if (!zone) return res.send(404);

      var user = req.session.user;

      switch (req.body.action)
      {
        case 'startProgram':
          startProgram(req, res, next, zone, user);
          break;

        case 'stopProgram':
          stopProgram(req, res, next, zone, user);
          break;

        case 'start':
          startZone(res, next, zone);
          break;

        case 'stop':
          stopZone(res, next, zone);
          break;

        default:
          res.send(400);
      }
    });
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

  var privilage = data.program ? 'assignPrograms' : 'manageZones';

  auth(privilage)(req, res, function()
  {
    app.db.model('Zone').update({_id: req.params.id}, data, function(err, count)
    {
      if (err) return next(err);

      if (!count) return res.send(404);

      res.send(204);

      app.io.sockets.emit('zone changed', {id: req.params.id, changes: data});
    });
  });
});

app.del('/zones/:id', auth('manageZones'), function(req, res, next)
{
  app.db.model('Zone').remove({_id: req.params.id}, function(err)
  {
    if (err) return next(err);

    res.send(204);

    app.io.sockets.emit('zone removed', req.params.id);
  });
});

app.get('/zones/:id/programs', function(req, res, nextHandler)
{
  step(
    function findZoneStep()
    {
      app.db.model('Zone').findById(req.params.id, {name: 1, program: 1})
                          .run(this);
    },
    function findAssignedProgramStep(err, zone)
    {
      var nextStep = this;

      if (err) return nextStep(err);

      if (!zone) return nextStep(404);

      app.db.model('Program').findById(zone.program, {name: 1}).run(
        function(err, program) { nextStep(err, zone, program); }
      );
    },
    function checkAuthStep(err, zone, program)
    {
      var nextStep = this;

      if (err) return nextStep(err);

      var data = {
        zone: {id: zone.id, name: zone.name}
      };

      if (program)
      {
        data.assignedProgram = {id: program.id, name: program.name};
      }

      var user = req.session.user;

      if (user && user.privilages.pickProgram)
      {
        return attachPickProgramData(data, nextStep);
      }

      return data;
    },
    function sendResponseStep(err, data)
    {
      if (err)
      {
        return err === 404 ? res.send(404) : nextHandler(err);
      }

      return res.send(data);
    }
  );
});

function attachPickProgramData(data, done)
{
  step(
    function findAllPrograms()
    {
      app.db.model('Program').find({}, {name: 1}).asc('name').run(this);
    },
    function findRecentlyRunPrograms(err, allPrograms)
    {
      var nextStep = this;

      if (err) return nextStep(err);

      var HistoryEntry = app.db.model('HistoryEntry');
      var criteria     = {
        zoneId     : data.zone.id,
        finishState: 'finish'
      };
      var fields       = {programId: 1, programName: 1};

      HistoryEntry.find(criteria, fields)
                  .desc('finishedAt')
                  .limit(10)
                  .run(function(err, historyEntries)
                  {
                    nextStep(err, allPrograms, historyEntries);
                  });
    },
    function cleanUpListsStep(err, allPrograms, recentHistoryEntries)
    {
      var nextStep = this;

      if (err) return nextStep(err);

      var allProgramIds = {};

      data.allPrograms = allPrograms.map(function(program)
      {
        allProgramIds[program.id] = true;

        return {
          id  : program.id,
          name: program.name
        };
      });
      data.recentPrograms = [];

      var recentProgramIds = {};

      for (var i = 0, l = recentHistoryEntries.length; i < l; ++i)
      {
        if (data.recentPrograms.length === 5)
        {
          break;
        }

        var historyEntry = recentHistoryEntries[i];
        var programId    = historyEntry.programId;

        if (!allProgramIds[programId])
        {
          continue;
        }

        if (recentProgramIds[programId])
        {
          continue;
        }

        recentProgramIds[programId] = 1;

        data.recentPrograms.push({
          id  : programId,
          name: historyEntry.programName
        });
      }

      return nextStep(null);
    },
    function finishStep(err)
    {
      return done(err, data);
    }
  );
}

function startProgram(req, res, next, zone, user)
{
  var canPickProgram = user.privilages.hasOwnProperty('pickProgram');
  var pin            = req.body.pin;
  var programId      = req.body.program;
  var hasPin         = _.isString(pin);
  var hasProgramId   = _.isString(programId);

  if (hasProgramId && !canPickProgram)
  {
    return res.send(401);
  }

  if (canPickProgram && !hasProgramId)
  {
    return res.send('Nie wybrano programu.', 400);
  }

  if (hasPin && !hasProgramId)
  {
    var User = app.db.model('User');

    User.findOne({pin: pin}, {name: 1, privilages: 1}).run(function(err, user)
    {
      if (err)
        return next(err);

      if (!user)
        return res.send('Niepoprawny PIN :(', 400);

      if (!user.privilages.startStop)
        return res.send('Nie masz uprawnień do uruchamiania stref :(', 401);

      return start(zone.program, {_id: user.id, name: user.name});
    });
  }
  else if (!canPickProgram)
  {
    return res.send('Nie masz uprawnień do wybierania programów :(', 401);
  }
  else
  {
    return start(programId, user);
  }

  function start(programId, user)
  {
    zone.startProgram(programId, user, function(err, historyEntry)
    {
      if (err)
      {
        console.debug(
          'Failed to start program <%s> on zone <%s>: %s',
          historyEntry ? historyEntry.programName : programId,
          zone.get('name'),
          err
        );
      }
      else
      {
        console.debug(
          'Started program <%s> on zone <%s>',
          historyEntry.programName,
          zone.get('name')
        );
      }

      if (err instanceof Error) return next(err);

      if (err) return res.send(err, 500);

      res.send();
    });
  }
}

function stopProgram(req, res, next, zone, user)
{
  var pin = req.body.pin;

  if (user.privilages.hasOwnProperty('pickProgram'))
  {
    return stop(user);
  }

  if (!_.isString(pin) || !pin.length)
  {
    return res.send('PIN jest wymagany :(', 400);
  }

  var User = app.db.model('User');

  User.findOne({pin: pin}, {name: 1, privilages: 1}).run(function(err, user)
  {
    if (err)
      return next(err);

    if (!user)
      return res.send('Niepoprawny PIN :(', 400);

    if (!user.privilages.startStop)
      return res.send('Nie masz uprawnień do zatrzymywania stref :(', 401);

    return stop({_id: user.id, name: user.name});
  });

  function stop(user)
  {
    zone.stopProgram(user, function(err)
    {
      if (err)
      {
        console.debug(
          'Failed to stop program on zone <%s>: %s',
          zone.get('name'),
          err
        );
      }
      else
      {
        console.debug('Stopped program on zone <%s>', zone.get('name'));
      }

      if (err instanceof Error) return next(err);

      if (err) return res.send(err, 500);

      res.send();
    });
  }
}

function startZone(res, next, zone)
{
  zone.start(function(err)
  {
    if (err)
    {
      console.debug(
        'Starting zone <%s> failed: %s', zone.name, err.message || err
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
      console.debug('Started zone <%s>', zone.name);

      res.send(201);
    }
  });
}

function stopZone(res, next, zone)
{
  zone.stop(function(err)
  {
    if (err)
    {
      console.debug(
        'Stopping zone <%s> failed: %s', zone.name, err.message || err
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
      console.debug('Stopped zone <%s>', zone.name);

      res.send(201);
    }
  });
}
