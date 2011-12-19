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
    urlRoot : '/programs',
    defaults: {
      name    : '',
      infinite: false,
      steps   : []
    }
  });

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
              timeOn    : parseInt(step.timeOn) || 0,
              timeOff   : parseInt(step.timeOff) || 0,
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
        timeOn    : '',
        timeOff   : '',
        iterations: ''
      });
    }

    return data;
  };

  return Program;
});
