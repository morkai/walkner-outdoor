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
});

Step.virtual('totalTime').get(function()
{
  return (this.get('timeOn') + this.get('timeOff')) * this.get('iterations');
});

var Program = new mongoose.Schema({
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
});

Program.virtual('totalTime').get(function()
{
  var totalTime = 0;

  this.steps.forEach(function(step) { totalTime += step.get('totalTime'); });

  return totalTime;
});

module.exports = mongoose.model('Program', Program);
