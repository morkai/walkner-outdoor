var _         = require('underscore');
var step      = require('step');
var mongoose  = require('mongoose');
var ZoneState = require('./ZoneState');

var zoneStates = {};

var Zone = new mongoose.Schema({
  name: {
    type    : String,
    required: true,
    trim    : true
  },
  controller: {
    type: mongoose.SchemaTypes.ObjectId
  },
  controllerInfo: {}
});

Zone.methods.toObject = function(options)
{
  var object = mongoose.Document.prototype.toObject.call(this, options);

  if ('state' in this.fields)
  {
    var state = zoneStates[object._id];

    object.state = state ? state.toClientObject() : null;
  }

  return object;
};

Zone.methods.start = function(programId, cb)
{
  var zone         = this;
  var zoneId       = zone.get('id');
  var controllerId = zone.get('controller');
  var state        = zoneStates[zoneId];

  if (state)
  {
    return cb('Strefa jest już uruchomiona.');
  }

  step(
    function findProgram()
    {
      mongoose.model('Program').findById(programId, this);
    },
    function findController(err, program)
    {
      if (err) throw err;

      if (!program) throw 'Nie znaleziono wybranego programu :(';

      var next = this;

      mongoose.model('Controller').findById(controllerId, function(err, controller)
      {
        next(err, program, controller);
      });
    },
    function setUpZoneState(err, program, controller)
    {
      if (err) throw err;

      if (!controller) throw 'Strefa nie ma przypisanego sterownika.';

      controller.start(new ZoneState(zone, program, zone.onStop.bind(zone)), this);
    },
    function finalize(err, zoneState)
    {
      if (err) throw err;

      zoneStates[zoneState.zoneId] = zoneState;

      var clientState = zoneState.toClientObject();

      process.nextTick(function()
      {
        app.io.sockets.emit('zone started', {
          zone : zoneState.zoneId,
          state: clientState
        });
      });

      this(null, clientState);
    },
    cb
  );
};

Zone.methods.stop = function(cb)
{
  var zoneId = this.get('id');
  var state  = zoneStates[zoneId];

  if (!state)
  {
    return cb('Strefa nie jest uruchomiona.');
  }

  mongoose.model('Controller').findById(this.get('controller'), function(err, controller)
  {
    controller.stop(zoneId, function()
    {
      delete zoneStates[zoneId];

      cb();

      app.io.sockets.emit('zone stopped', {zone: zoneId});
    });
  });
};

Zone.methods.onStop = function()
{
  var zoneId    = this.get('id');
  var zoneState = zoneStates[zoneId];

  if (!zoneState) return;

  delete zoneStates[zoneId];

  var error;

  if (_.isString(zoneState.error))
  {
    error = zoneState.error;
  }
  else if (_.isObject(zoneState.error) && _.isString(zoneState.error.message))
  {
    error = zoneState.error.message;
  }

  app.io.sockets.emit('zone stopped', {
    zone : zoneId,
    error: error
  });

  zoneState.destroy();
};

module.exports = mongoose.model('Zone', Zone);
