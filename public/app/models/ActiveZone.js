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
