var _         = require('underscore');
var step      = require('step');
var mongoose  = require('mongoose');
var controllerProcesses = require('./controllerProcesses');

var zoneStates = {};

const RED_LED_ON_ERROR_FOR = 30000;

var Zone = module.exports = new mongoose.Schema({
  name: {
    type    : String,
    required: true,
    trim    : true
  },
  program: {
    type: mongoose.SchemaTypes.ObjectId
  },
  controller: {
    type: mongoose.SchemaTypes.ObjectId
  },
  controllerInfo: {}
}, {
  strict: true
});

Zone.statics.startAll = function(done)
{
  mongoose.model('Zone').find().run(function(err, zones)
  {
    if (err)
    {
      return done(err);
    }

    var zonesToStart = zones.length;
    var startedZones = 0;

    zones.forEach(function(zone)
    {
      zone.start(function(err)
      {
        if (err)
        {
          console.debug(
            'Starting zone <%s> failed: %s', zone.name, err.message || err
          );
        }

        if (++startedZones === zonesToStart)
        {
          return done();
        }
      });
    });
  });
};

Zone.methods.start = function(done)
{
  controllerProcesses.startZone(this, done);
};

Zone.methods.stop = function(done)
{
  controllerProcesses.stopZone(this, done);
};

Zone.methods.startProgram = function(programId, user, done)
{
  var zone = this;

  mongoose.model('Program').findById(programId).run(function(err, program)
  {
    if (program.totalTime === 0)
    {
      return done('Wybrany program nie ma zdefiniowanych żadnych kroków.');
    }

    controllerProcesses.startProgram(program, zone.id, onProgramFinish, function(err)
    {
      if (err)
      {
        return done(err);
      }

      var HistoryEntry = mongoose.model('HistoryEntry');
      var historyEntry = new HistoryEntry({
        zoneId       : zone.id,
        zoneName     : zone.name,
        programId    : program.id,
        programName  : program.name,
        programSteps : program.steps,
        infinite     : program.infinite,
        startUserId  : user ? user.id : null,
        startUserName: user ? user.name : null,
        startedAt    : new Date()
      });

      zoneStates[zone.id] = historyEntry;

      done(null, historyEntry);

      app.io.sockets.emit('program started', historyEntry.toJSON());
    });
  });
};

Zone.methods.stopProgram = function(user, done)
{
  var zone         = this;
  var historyEntry = zoneStates[zone.id];

  if (!historyEntry)
  {
    return done();
  }

  controllerProcesses.stopProgram(zone.id, function(err)
  {
    if (err)
    {
      return done(err);
    }

    done();

    historyEntry.set({
      finishState : 'stop',
      finishedAt  : new Date(),
      stopUserId  : user ? user.id : null,
      stopUserName: user ? user.name : null
    });
    historyEntry.save();

    app.io.sockets.emit('program stopped', historyEntry.toJSON());

    delete zoneStates[zone.id];
  });
};

Zone.methods.toObject = function(options)
{
  var object = mongoose.Document.prototype.toObject.call(this, options);

  if ('state' in this.fields)
  {
    var state = zoneStates[object._id];

    if (state)
    {
      object.state = state ? state.toJSON() : null;
    }
  }

  return object;
};

function onProgramFinish(data)
{
  var zoneId       = data.zoneId;
  var historyEntry = zoneStates[zoneId];

  if (!historyEntry)
  {
    return console.error(
      'Unexpected program <%s> just finished on zone <%s> with state <%s>',
      data.programName,
      data.zoneName,
      data.finishState
    );
  }

  historyEntry.set({
    finishedAt  : data.finishedAt,
    finishState : data.finishState,
    errorMessage: data.errorMessage
  });

  app.io.sockets.emit('program stopped', historyEntry.toJSON());

  historyEntry.save();

  console.debug(
    'Finished program <%s> on zone <%s> with state <%s>',
    data.programName,
    data.zoneName,
    data.finishState
  );

  if (data.finishState === 'error')
  {
    var historyEntryId = historyEntry.id;

    setTimeout(
      function()
      {
        var historyEntry = zoneStates[zoneId];

        if (historyEntry && historyEntry.id === historyEntryId)
        {
          delete zoneStates[zoneId];
        }
      },
      RED_LED_ON_ERROR_FOR
    );
  }
  else
  {
    delete zoneStates[data.zoneId];
  }
}

mongoose.model('Zone', Zone);
