// Copyright (c) 2014, Łukasz Walukiewicz <lukasz@walukiewicz.eu>. Some Rights Reserved.
// Licensed under CC BY-NC-SA 4.0 <http://creativecommons.org/licenses/by-nc-sa/4.0/>.
// Part of the walkner-outdoor project <http://lukasz.walukiewicz.eu/p/walkner-outdoor>

define(
[
  'Underscore',
  'Backbone',

  'app/time'
],
/**
 * @param {Underscore} _
 * @param {Backbone} Backbone
 * @param {Object} time
 */
function(_, Backbone, time)
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
    return time.toString(
      arguments.length === 1
        ? startTimeOrTime
        : ((stopTime - startTimeOrTime) / 1000)
    );
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
    var data = this.toJSON();

    for (var i = data.steps.length; i < minSteps; ++i)
    {
      data.steps.push({
        timeOn: '',
        timeOff: '',
        iterations: ''
      });
    }

    data.duration = time.toString(data.totalTime);

    return data;
  };

  return Program;
});
