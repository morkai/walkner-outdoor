define(
[
  'Backbone',

  'app/models/Controller'
],
/**
 * @param {Backbone} Backbone
 * @param {function(new:Controller)} Controller
 */
function(Backbone, Controller)
{
  /**
   * @class Controllers
   * @extends Backbone.Collection
   * @constructor
   * @param {Array.<Controller>} [models]
   * @param {Object} [options]
   */
  var Controllers = Backbone.Collection.extend({
    model: Controller,
    url: '/controllers'
  });

  return Controllers;
});
