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

  /**
   * @param {Object} res
   * @return {Array.<Object>}
   */
  History.prototype.parse = function(res)
  {
    this.page = res.page || 1;
    this.limit = res.limit || 10;
    this.pages = res.pages || 1;
    this.totalCount = res.totalCount || res.data.length;

    return res.data;
  };

  return History;
});
