// Copyright (c) 2014, Łukasz Walukiewicz <lukasz@walukiewicz.eu>. Some Rights Reserved.
// Licensed under CC BY-NC-SA 4.0 <http://creativecommons.org/licenses/by-nc-sa/4.0/>.
// Part of the walkner-outdoor project <http://lukasz.walukiewicz.eu/p/walkner-outdoor>

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
