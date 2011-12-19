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

    switch (data.type)
    {
      case 'modbus-tcp':
        data.typeText       = 'MODBUS TCP/IP';
        data.connectionInfo = _.defaults(data.connectionInfo || {}, {
          host: '127.0.0.1',
          port: 502
        });
        break;

      default:
        data.connectionInfo = {};
    }

    return data;
  };

  return Controller;
});
