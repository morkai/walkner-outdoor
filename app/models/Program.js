// Copyright (c) 2014, Łukasz Walukiewicz <lukasz@walukiewicz.eu>. Some Rights Reserved.
// Licensed under CC BY-NC-SA 4.0 <http://creativecommons.org/licenses/by-nc-sa/4.0/>.
// Part of the walkner-outdoor project <http://lukasz.walukiewicz.eu/p/walkner-outdoor>

var mongoose = require('mongoose');

var Step = new mongoose.Schema({
  timeOn: {
    type: Number,
    required: true
  },
  timeOff: {
    type: Number,
    required: true
  },
  iterations: {
    type: Number,
    required: true
  }
}, {
  strict: true
});

Step.virtual('totalTime').get(function()
{
  return (this.get('timeOn') + this.get('timeOff')) * this.get('iterations');
});

Step.methods.toObject = function(options)
{
  var obj = mongoose.Document.prototype.toObject.call(this, options);

  delete obj._id;

  return obj;
};

var Program = module.exports = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  infinite: {
    type: Boolean,
    'default': false
  },
  steps: {
    type: [Step]
  }
}, {
  strict: true
});

Program.virtual('totalTime').get(function()
{
  var totalTime = 0;

  this.steps.forEach(function(step) { totalTime += step.get('totalTime'); });

  return totalTime;
});

/**
 * @param {Object} [options]
 * @return {Object}
 */
Program.methods.toObject = function(options)
{
  var obj = mongoose.Document.prototype.toObject.call(this, options);

  if (obj.steps)
  {
    obj.totalTime = this.get('totalTime');
  }

  return obj;
};

mongoose.model('Program', Program);
