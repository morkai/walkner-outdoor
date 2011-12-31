define(
[
  'Backbone',

  'app/models/History',
  'app/models/HistoryEntry',
  'app/views/viewport',
  'app/views/history/HistoryListView',
  'app/views/history/HistoryEntryView'
],
/**
 * @param {Backbone} Backbone
 * @param {function(new:History)} History
 * @param {function(new:HistoryEntry)} HistoryEntry
 * @param {Viewport} viewport
 * @param {function(new:HistoryListView)} HistoryListView
 * @param {function(new:HistoryEntryView)} HistoryEntryView
 */
function(
  Backbone,
  History,
  HistoryEntry,
  viewport,
  HistoryListView,
  HistoryEntryView)
{

/**
 * @class HistoryRouter
 * @constructor
 * @extends Backbone.Router
 * @param {Object} [options]
 */
var HistoryRouter = Backbone.Router.extend({
  routes: {
    'history'    : 'list',
    'history/:id': 'view'
  }
});

HistoryRouter.prototype.list = function()
{
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

return HistoryRouter;

});
