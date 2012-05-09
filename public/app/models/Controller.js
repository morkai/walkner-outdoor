define(
[
  'Underscore',
  'Backbone',

  'app/models/controllerTypes'
],
/**
 * @param {Underscore} _
 * @param {Backbone} Backbone
 * @param {Object} controllerTypes
 */
function(_, Backbone, controllerTypes)
{
  /**
   * @class Controller
   * @extends Backbone.Model
   * @constructor
   * @param {Object} [attributes]
   * @param {Object} [options]
   */
  var Controller = Backbone.Model.extend({
    urlRoot: '/controllers'
  });

  /**
   * @return {Object}
   */
  Controller.prototype.toTemplateData = function()
  {
    var data = this.toJSON();

    data.typeText = controllerTypes[data.type] || '-';

    switch (data.type)
    {
      case 'modbus-tcp':
        data.connectionInfo = _.defaults(data.connectionInfo || {}, {
          host: '127.0.0.1',
          port: 502
        });
        break;

      case 'libcoap':
        data.connectionInfo = _.defaults(data.connectionInfo || {}, {
          uri: 'coap://127.0.0.1'
        });
        break;

      case 'remote-libcoap':
        data.connectionInfo = _.defaults(data.connectionInfo || {}, {
          uri: 'coap://127.0.0.1'
        });
        break;

      default:
        data.connectionInfo = {};
    }

    return data;
  };

  return Controller;
});
