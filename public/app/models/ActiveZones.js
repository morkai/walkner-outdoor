define(
[
  'Backbone',

  'app/models/ActiveZone'
],
/**
 * @param {Backbone} Backbone
 * @param {function(new:ActiveZone)} ActiveZone
 */
function(Backbone, ActiveZone)
{
  /**
   * @class Zones
   * @extends Backbone.Collection
   * @constructor
   * @param {Array.<ActiveZone>} [models]
   * @param {Object} [options]
   */
  var ActiveZones = Backbone.Collection.extend({
    model: ActiveZone,
    url: '/activeZones'
  });

  ActiveZones.prototype.comparator = function(activeZone)
  {
    return activeZone.get('name');
  };

  return ActiveZones;
});
