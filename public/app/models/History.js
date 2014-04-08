// Copyright (c) 2014, Łukasz Walukiewicz <lukasz@walukiewicz.eu>. Some Rights Reserved.
// Licensed under CC BY-NC-SA 4.0 <http://creativecommons.org/licenses/by-nc-sa/4.0/>.
// Part of the walkner-outdoor project <http://lukasz.walukiewicz.eu/p/walkner-outdoor>

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
