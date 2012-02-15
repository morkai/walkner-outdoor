define(
[
  'Underscore',
  'Backbone',

  'app/models/Controller',
  'app/models/Program'
],
/**
 * @param {Underscore} _
 * @param {Backbone} Backbone
 * @param {function(new:Controller)} Controller
 * @param {function(new:Program)} Program
 */
function(_, Backbone, Controller, Program)
{
  /**
   * @class Zone
   * @extends Backbone.Model
   * @constructor
   * @param {Object} [attributes]
   * @param {Object} [options]
   */
  var Zone = Backbone.Model.extend({
    urlRoot: '/zones',
    defaults: {
      name: '',
      controller: null,
      controllerInfo: null,
      state: null
    }
  });

  /**
   * @param {Object} res
   * @return {Object}
   */
  Zone.prototype.parse = function(res)
  {
    if (!res)
    {
      return res;
    }

    if (_.isObject(res.controller))
    {
      res.controller = new Controller(res.controller);
    }

    if (_.isObject(res.program))
    {
      res.program = new Program(res.program);
    }

    return res;
  };

  /**
   * @return {Object}
   */
  Zone.prototype.toTemplateData = function()
  {
    var data = this.toJSON();

    if (data.controller instanceof Controller)
    {
      data.controller = data.controller.toTemplateData();

      switch (data.controller.type)
      {
        case 'modbus-tcp':
          data.controllerInfo = _.defaults(data.controllerInfo || {}, {
            stateOutput: 0,
            stateUnit: 0,
            greenLedOutput: 1,
            greenLedUnit: 0,
            redLedOutput: 2,
            redLedUnit: 0
          });
          break;

        case 'libcoap':
          data.controllerInfo = _.defaults(data.controllerInfo || {}, {
            stateResource: '/io/state',
            greenLedResource: '/io/greenLed',
            redLedResource: '/io/redLed'
          });
          break;
      }
    }
    else
    {
      data.controller = {};
      data.controllerInfo = {};
    }

    data.program = data.program instanceof Program
      ? data.program.toTemplateData()
      : {};

    return data;
  };

  return Zone;
});
