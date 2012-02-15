var mongoose = require('mongoose');
var controllerProcesses = require('./controllerProcesses');

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
