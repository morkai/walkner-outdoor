// Copyright (c) 2014, Łukasz Walukiewicz <lukasz@walukiewicz.eu>. Some Rights Reserved.
// Licensed under CC BY-NC-SA 4.0 <http://creativecommons.org/licenses/by-nc-sa/4.0/>.
// Part of the walkner-outdoor project <http://lukasz.walukiewicz.eu/p/walkner-outdoor>

var _ = require('underscore');
var mongoose = require('mongoose');

var HistoryEntry = module.exports = new mongoose.Schema({
  zoneId: {
    type: mongoose.SchemaTypes.ObjectId,
    required: true
  },
  zoneName: {
    type: String,
    required: true,
    trim: true
  },
  programId: {
    type: mongoose.SchemaTypes.ObjectId,
    required: true
  },
  programName: {
    type: String,
    required: true,
    trim: true
  },
  programSteps: {
    type: [{}],
    required: true
  },
  infinite: {
    type: Boolean
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
    type: Date,
    required: true
  },
  finishedAt: {
    type: Date
  },
  finishState: {
    type: String,
    enum: ['finish', 'stop', 'error']
  },
  errorMessage: {
    type: String
  }
}, {
  strict: true
});

function finish(id, state, data, cb)
{
  data.finishedAt = new Date();
  data.finishState = state;

  mongoose.model('HistoryEntry').update({_id: id}, data, cb || function() {});
};

HistoryEntry.statics.markInterruptedEntries = function(done)
{
  var condition = {finishState: {$exists: false}};
  var options = {multi: true};
  var data = {
    finishState: 'error',
    finishedAt: new Date(),
    errorMessage: 'Nagłe wyłączenie systemu.'
  };

  mongoose.model('HistoryEntry').update(condition, data, options, done);
};

HistoryEntry.statics.finished = function(id, error, cb)
{
  var data = {};

  if (_.isObject(error) && _.isString(error.message))
  {
    data.errorMessage = error.message;
  }
  else if (_.isString(error))
  {
    data.errorMessage = error;
  }

  finish(id, data.error ? 'error' : 'finish', data, cb);
};

HistoryEntry.statics.stopped = function(id, user, cb)
{
  var data = {};

  if (user)
  {
    data.stopUserId = user._id;
    data.stopUserName = user.name;
  }

  finish(id, 'stop', data, cb);
};

mongoose.model('HistoryEntry', HistoryEntry);
