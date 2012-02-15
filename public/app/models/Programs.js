define(
[
  'Backbone',

  'app/models/Program'
],
/**
 * @param {Backbone} Backbone
 * @param {function(new:Program)} Program
 */
function(Backbone, Program)
{
  /**
   * @class Programs
   * @extends Backbone.Collection
   * @constructor
   * @param {Array.<Program>} [models]
   * @param {Object} [options]
   */
  var Programs = Backbone.Collection.extend({
    model: Program,
    url: '/programs'
  });

  return Programs;
});
