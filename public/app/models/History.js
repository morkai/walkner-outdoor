define(
[
  'Backbone',

  'app/models/HistoryEntry'
],
/**
 * @param {Backbone} Backbone
 * @param {function(new:HistoryEntry)} HistoryEntry
 */
function(Backbone, HistoryEntry)
{
  /**
   * @class History
   * @extends Backbone.Collection
   * @constructor
   * @param {Array.<HistoryEntry>} [models]
   * @param {Object} [options]
   */
  var History = Backbone.Collection.extend({
    model: HistoryEntry,
    url: '/history'
  });

  return History;
});
