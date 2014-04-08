// Copyright (c) 2014, Łukasz Walukiewicz <lukasz@walukiewicz.eu>. Some Rights Reserved.
// Licensed under CC BY-NC-SA 4.0 <http://creativecommons.org/licenses/by-nc-sa/4.0/>.
// Part of the walkner-outdoor project <http://lukasz.walukiewicz.eu/p/walkner-outdoor>

define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/models/History',
  'app/models/HistoryEntry',
  'app/views/viewport',
  'app/views/history/HistoryListView',
  'app/views/history/HistoryEntryView',
  'app/views/history/PurgeHistoryFormView',
  'app/views/history/StatsView'
],
/**
 * @param {jQuery} $
 * @param {Underscore} _
 * @param {Backbone} Backbone
 * @param {function(new:History)} History
 * @param {function(new:HistoryEntry)} HistoryEntry
 * @param {Viewport} viewport
 * @param {function(new:HistoryListView)} HistoryListView
 * @param {function(new:HistoryEntryView)} HistoryEntryView
 * @param {function(new:PurgeHistoryFormView)} PurgeHistoryFormView
 * @param {function(new:StatsView)} StatsView
 */
function(
  $,
  _,
  Backbone,
  History,
  HistoryEntry,
  viewport,
  HistoryListView,
  HistoryEntryView,
  PurgeHistoryFormView,
  StatsView)
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
      'history?page=:page': 'list',
      'history;purge': 'purge',
      'history;stats': 'stats'
    }
  });

  HistoryRouter.prototype.list = function(page)
  {
    if (viewport.msg.auth('viewHistory'))
    {
      return;
    }

    viewport.msg.loading();

    $.ajax({
      url: '/history;page',
      success: function(data)
      {
        var collection = new History();
        collection.page = page;

        viewport.showView(new HistoryListView({
          collection: collection,
          model: data
        }));
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

  HistoryRouter.prototype.stats = function()
  {
    if (viewport.msg.auth('stats'))
    {
      return;
    }

    viewport.msg.loading();

    $.ajax({
      url: '/history;stats',
      success: function(data)
      {
        viewport.showView(new StatsView({
          model: data
        }));
      },
      error: function()
      {
        viewport.msg.loadingFailed();
      }
    });
  };

  return HistoryRouter;
});
