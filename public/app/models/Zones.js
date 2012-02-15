define(
[
  'Backbone',

  'app/models/Zone'
],
/**
 * @param {Backbone} Backbone
 * @param {function(new:Zone)} Zone
 */
function(Backbone, Zone)
{
  /**
   * @class Zones
   * @extends Backbone.Collection
   * @constructor
   * @param {Array.<Zone>} [models]
   * @param {Object} [options]
   */
  var Zones = Backbone.Collection.extend({
    model: Zone,
    url: '/zones'
  });

  return Zones;
});
