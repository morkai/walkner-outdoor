// Copyright (c) 2014, Łukasz Walukiewicz <lukasz@walukiewicz.eu>. Some Rights Reserved.
// Licensed under CC BY-NC-SA 4.0 <http://creativecommons.org/licenses/by-nc-sa/4.0/>.
// Part of the walkner-outdoor project <http://lukasz.walukiewicz.eu/p/walkner-outdoor>

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
   * @class ActiveZone
   * @extends Backbone.Model
   * @constructor
   * @param {Object} [attributes]
   * @param {Object} [options]
   */
  var ActiveZone = Backbone.Model.extend({
    urlRoot: '/activeZones',
    defaults: {
      assignedProgram: null
    }
  });

  /**
   * @return {Object}
   */
  ActiveZone.prototype.toTemplateData = function()
  {
    var data = this.toJSON();

    return data;
  };

  return ActiveZone;
});
