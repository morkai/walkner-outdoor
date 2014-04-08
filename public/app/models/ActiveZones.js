// Copyright (c) 2014, Łukasz Walukiewicz <lukasz@walukiewicz.eu>. Some Rights Reserved.
// Licensed under CC BY-NC-SA 4.0 <http://creativecommons.org/licenses/by-nc-sa/4.0/>.
// Part of the walkner-outdoor project <http://lukasz.walukiewicz.eu/p/walkner-outdoor>

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
