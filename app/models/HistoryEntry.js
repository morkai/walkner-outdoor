var _        = require('underscore');
var mongoose = require('mongoose');

var HistoryEntry = new mongoose.Schema({
  zoneId: {
    type    : mongoose.SchemaTypes.ObjectId,
    required: true
  },
  zoneName: {
    type    : String,
    required: true,
    trim    : true
  },
  programId: {
    type    : mongoose.SchemaTypes.ObjectId,
    required: true
  },
  programName: {
    type    : String,
    required: true,
    trim    : true
  },
  programSteps: {
    type    : [{}],
    required: true
  },
  startUserId: {
    type: mongoose.SchemaTypes.ObjectId
  },
  startUserName: {
    type: String,
    trim: true
  },
  stopUserId: {
    type: mongoose.SchemaTypes.ObjectId
  },
  stopUserName: {
    type: String,
    trim: true
  },
  startedAt: {
    type    : Date,
    required: true
  },
  finishedAt: {
    type: Date
  },
  finishState: {
    type    : String,
    enum    : ['finish', 'stop', 'error']
  },
  error: {
    type: String
  }
}, {
  strict: true
});

function finish(id, state, data, cb)
{
  data.finishedAt  = new Date();
  data.finishState = state;

  mongoose.model('HistoryEntry').update({_id: id}, data, cb || function() {});
};

HistoryEntry.statics.finished = function(id, error, cb)
{
  var data = {};

  if (_.isObject(error) && _.isString(error.message))
  {
    data.error = error.message;
  }
  else if (_.isString(error))
  {
    data.error = error;
  }

  finish(id, data.error ? 'error' : 'finish', data, cb);
};

HistoryEntry.statics.stopped = function(id, user, cb)
{
  var data = {};

  if (user)
  {
    data.stopUserId   = user.id;
    data.stopUserName = user.name;
  }

  finish(id, 'stop', data, cb);
};

module.exports = mongoose.model('HistoryEntry', HistoryEntry);
