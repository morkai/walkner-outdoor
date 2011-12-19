define(
[
  'Underscore',
  'Backbone',

  'app/models/Controller'
],
/**
 * @param {Underscore} _
 * @param {Backbone} Backbone
 * @param {function(new:Controller)} Controller
 */
function(_, Backbone, Controller)
{
  /**
   * @class Zone
   * @extends Backbone.Model
   * @constructor
   * @param {Object} [attributes]
   * @param {Object} [options]
   */
  var Zone = Backbone.Model.extend({
    urlRoot : '/zones',
    defaults: {
      name          : '',
      controller    : null,
      controllerInfo: null,
      state         : null
    }
  });

  /**
   * @param {Object} res
   * @return {Object}
   */
  Zone.prototype.parse = function(res)
  {
    if (res && _.isObject(res.controller))
    {
      res.controller = new Controller(res.controller);
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
            stateOutput   : 0,
            stateUnit     : 0,
            greenLedOutput: 1,
            greenLedUnit  : 0,
            redLedOutput  : 2,
            redLedUnit    : 0
          });
          break;
      }
    }
    else
    {
      data.controller     = {};
      data.controllerInfo = {};
    }

    return data;
  };

  return Zone;
});