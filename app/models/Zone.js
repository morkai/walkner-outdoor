var mongoose = require('mongoose');
var controllerProcesses = require('./controllerProcesses');

var Zone = module.exports = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  program: {
    type: mongoose.SchemaTypes.ObjectId
  },
  controller: {
    type: mongoose.SchemaTypes.ObjectId
  },
  controllerInfo: {},
  autostart: {
    type: Boolean,
    'default': false
  }
}, {
  strict: true
});

Zone.statics.startAll = function(autostartOnly, done)
{
  var cond = {};

  if (autostartOnly)
  {
    cond.autostart = true;
  }

  mongoose.model('Zone').find(cond).run(function(err, zones)
  {
    if (err)
    {
      return done(err);
    }

    var zonesToStart = zones.length;
    var startedZones = 0;

    if (zonesToStart === 0)
    {
      return done();
    }

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

Zone.methods.isStarted = function()
{
  return controllerProcesses.isZoneStarted(this._id);
};

Zone.methods.start = function(done)
{
  controllerProcesses.startZone(this, done);
};

Zone.methods.stop = function(done)
{
  controllerProcesses.stopZone(this._id, done);
};

Zone.methods.reset = function(done)
{
  controllerProcesses.resetZone(this._id, done);
};

Zone.methods.startProgram = function(programId, user, done)
{
  var zone = this;

  mongoose.model('Program').findById(programId).run(function(err, program)
  {
    if (err)
    {
      return done(err);
    }

    if (!program)
    {
      return done('Dany program nie istnieje.');
    }

    if (program.totalTime === 0)
    {
      return done('Wybrany program nie ma zdefiniowanych żadnych kroków.');
    }

    controllerProcesses.startProgram(program, zone._id, user, done);
  });
};

Zone.methods.stopProgram = function(user, done)
{
  controllerProcesses.stopProgram(this._id, user, done);
};

mongoose.model('Zone', Zone);
