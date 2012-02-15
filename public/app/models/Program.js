define(
[
  'Underscore',
  'Backbone'
],
/**
 * @param {Underscore} _
 * @param {Backbone} Backbone
 */
function(_, Backbone)
{
  /**
   * @class Program
   * @extends Backbone.Model
   * @constructor
   * @param {Object} [attributes]
   * @param {Object} [options]
   */
  var Program = Backbone.Model.extend({
    urlRoot: '/programs',
    defaults: {
      name: '',
      infinite: false,
      steps: [],
      totalTime: 0
    }
  });

  /**
   * @param {Number} startTimeOrTime
   * @param {Number} stopTime
   * @return {String}
   */
  Program.calcDuration = function(startTimeOrTime, stopTime)
  {
    var time;

    if (arguments.length === 1)
    {
      time = startTimeOrTime;
    }
    else
    {
      time = (stopTime - startTimeOrTime) / 1000;
    }

    var duration = '';
    var hours = Math.floor(time / 3600);

    if (hours > 0)
    {
      duration += ' ' + hours + ' h';
      time = time % 3600;
    }

    var minutes = Math.floor(time / 60);

    if (minutes > 0)
    {
      duration += ' ' + minutes + ' min';
      time = time % 60;
    }

    var seconds = time;

    if (seconds >= 1)
    {
      duration += ' ' + Math.round(seconds) + ' s';
    }
    else if (seconds > 0 && duration === '')
    {
      duration += ' ' + seconds * 1000 + ' ms';
    }

    return duration.substr(1);
  };

  /**
   * @param {Array.<Object>} steps
   * @return {Number}
   */
  Program.countTotalTime = function(steps)
  {
    var totalTime = 0;

    _.each(steps, function(step)
    {
      totalTime += (step.timeOn + step.timeOff) * step.iterations;
    });

    return totalTime;
  };

  /**
   * @return {Number}
   */
  Program.prototype.countTotalTime = function()
  {
    return Program.countTotalTime(this.get('steps'));
  };

  /**
   * @param {Object} attrs
   * @return {?Array}
   */
  Program.prototype.validate = function(attrs)
  {
    var errors = [];

    for (var name in attrs)
    {
      var value = attrs[name];

      switch (name)
      {
        case 'name':
          if (value.trim() === '')
          {
            errors.push('Nazwa programu jest wymagana.');
          }
          break;

        case 'infinite':
          attrs.infinite = value ? true : false;
          break;

        case 'steps':
          if (!_.isArray(value))
          {
            value = [];
          }

          attrs.steps = [];

          _.each(value, function(step)
          {
            step = {
              timeOn: parseInt(step.timeOn) || 0,
              timeOff: parseInt(step.timeOff) || 0,
              iterations: parseInt(step.iterations) || 0
            };

            if (step.iterations && (step.timeOn || step.timeOff))
            {
              attrs.steps.push(step);
            }
          });
          break;
      }
    }

    return errors.length ? errors : null;
  };

  /**
   * @param {Object} [options]
   * @return {Object}
   */
  Program.prototype.toTemplateData = function(options)
  {
    var minSteps = options && options.minSteps ? options.minSteps : 0;
    var data     = this.toJSON();

    for (var i = data.steps.length; i < minSteps; ++i)
    {
      data.steps.push({
        timeOn: '',
        timeOff: '',
        iterations: ''
      });
    }

    data.duration = Program.calcDuration(data.totalTime);

    return data;
  };

  return Program;
});
