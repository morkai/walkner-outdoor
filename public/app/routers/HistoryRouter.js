define(
[
  'Backbone',

  'app/models/History',
  'app/models/HistoryEntry',
  'app/views/viewport',
  'app/views/history/HistoryListView',
  'app/views/history/HistoryEntryView',
  'app/views/history/PurgeHistoryFormView'
],
/**
 * @param {Backbone} Backbone
 * @param {function(new:History)} History
 * @param {function(new:HistoryEntry)} HistoryEntry
 * @param {Viewport} viewport
 * @param {function(new:HistoryListView)} HistoryListView
 * @param {function(new:HistoryEntryView)} HistoryEntryView
 * @param {function(new:PurgeHistoryFormView)} PurgeHistoryFormView
 */
function(
  Backbone,
  History,
  HistoryEntry,
  viewport,
  HistoryListView,
  HistoryEntryView,
  PurgeHistoryFormView)
{
  /**
   * @class HistoryRouter
   * @constructor
   * @extends Backbone.Router
   * @param {Object} [options]
   */
  var HistoryRouter = Backbone.Router.extend({
    routes: {
      'history': 'list',
      'history/:id': 'view',
      'history;purge': 'purge'
    }
  });

  HistoryRouter.prototype.list = function()
  {
    if (viewport.msg.auth('viewHistory'))
    {
      return;
    }

    viewport.msg.loading();

    new History().fetch({
      data: {
        fields: ['zoneName', 'programName', 'finishedAt', 'finishState']
      },
      success: function(collection)
      {
        viewport.showView(new HistoryListView({collection: collection}));
      },
      error: function()
      {
        viewport.msg.loadingFailed();
      }
    });
  };

  HistoryRouter.prototype.view = function(id)
  {
    if (viewport.msg.auth('viewHistory'))
    {
      return;
    }

    viewport.msg.loading();

    new HistoryEntry({_id: id}).fetch({
      success: function(model)
      {
        viewport.showView(new HistoryEntryView({model: model}));
      },
      error: function()
      {
        viewport.msg.loadingFailed();
      }
    });
  };

  HistoryRouter.prototype.purge = function()
  {
    if (viewport.msg.auth('purgeHistory'))
    {
      return;
    }

    viewport.showView(new PurgeHistoryFormView());
  };

  return HistoryRouter;
});
