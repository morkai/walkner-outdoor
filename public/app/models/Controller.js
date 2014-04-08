// Copyright (c) 2014, Łukasz Walukiewicz <lukasz@walukiewicz.eu>. Some Rights Reserved.
// Licensed under CC BY-NC-SA 4.0 <http://creativecommons.org/licenses/by-nc-sa/4.0/>.
// Part of the walkner-outdoor project <http://lukasz.walukiewicz.eu/p/walkner-outdoor>

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
      case 'remote-libcoap':
      case 'cf-proxy-08':
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
