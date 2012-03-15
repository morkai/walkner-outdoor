define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'text!app/templates/history/entriesTable.html'
],
/**
 * @param {jQuery} $
 * @param {Underscore} _
 * @param {Backbone} Backbone
 * @param {String} entriesTableTpl
 */
function(
  $,
  _,
  Backbone,
  entriesTableTpl)
{
  /**
   * @class HistoryListView
   * @constructor
   * @extends Backbone.View
   * @param {Object} [options]
   */
  var HistoryEntriesTableView = Backbone.View.extend({
    template: _.template(entriesTableTpl),
    tagName: 'table',
    className: 'historyEntries',
    events: {
      'click tbody tr': 'goToEntry'
    }
  });

  HistoryEntriesTableView.prototype.initialize = function(options)
  {
    this.collection.bind('reset', this.render, this);
  };

  HistoryEntriesTableView.prototype.destroy = function()
  {
    this.collection.unbind('reset', this.render, this);

    this.remove();
  };

  HistoryEntriesTableView.prototype.render = function()
  {
    $(this.el).html(this.template({
      showZoneName: this.options.showZoneName === false ? false : true,
      showProgramName: this.options.showProgramName === false ? false : true,
      entries: this.collection.map(function(entry)
      {
        return entry.toTemplateData();
      })
    }));

    return this;
  };

  /**
   * @private
   * @param {Object} e
   */
  HistoryEntriesTableView.prototype.goToEntry = function(e)
  {
    var entryId = $(e.target).closest('tr').attr('data-id');

    if (!entryId)
    {
      return;
    }

    window.location.href = '#history/' + entryId;

    e.preventDefault();
  };

  return HistoryEntriesTableView;
});
