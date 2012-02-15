define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/views/viewport',
  'app/views/PageLayout',
  'app/views/history/PurgeHistoryFormView',

  'text!app/templates/history/list.html',
  'text!app/templates/history/listItem.html'
],
/**
 * @param {jQuery} $
 * @param {Underscore} _
 * @param {Backbone} Backbone
 * @param {Viewport} viewport
 * @param {function(new:PageLayout)} PageLayout
 * @param {function(new:PurgeHistoryFormView)} PurgeHistoryFormView
 * @param {String} listTpl
 * @param {String} listItemTpl
 */
function(
  $,
  _,
  Backbone,
  viewport,
  PageLayout,
  PurgeHistoryFormView,
  listTpl,
  listItemTpl)
{
  /**
   * @class HistoryListView
   * @constructor
   * @extends Backbone.View
   * @param {Object} [options]
   */
  var HistoryListView = Backbone.View.extend({
    listTemplate: _.template(listTpl),
    listItemTemplate: _.template(listItemTpl),
    layout: PageLayout,
    title: 'Historia',
    className: 'history',
    breadcrumbs: ['Historia'],
    actions: function()
    {
      var onPurge = this.onPurge;

      return [
        {
          href: '#history;purge',
          text: 'Wyczyść',
          className: 'blue purge-history action',
          privileges: 'purgeHistory',
          handler: function(e)
          {
            if (e.button !== 0)
            {
              return;
            }

            viewport.showDialog(new PurgeHistoryFormView({onPurge: onPurge}));

            return false;
          }
        }
      ];
    },
    events: {
      'click .more': 'showMore'
    }
  });

  HistoryListView.prototype.initialize = function(options)
  {
    _.bindAll(this, 'onPurge');

    this.currentPage = options.page || 1;
  };

  HistoryListView.prototype.render = function()
  {
    this.el.innerHTML = this.listTemplate({
      showList: this.collection.length > 0,
      showMoreButton: this.collection.length >= 10
    });

    this.appendCollection(false);

    return this;
  };

  /**
   * @private
   * @param {Boolean} scrollToFirst
   */
  HistoryListView.prototype.appendCollection = function(scrollToFirst)
  {
    var listEl = this.$('.list');
    var lastEl = listEl.children().last();

    this.collection.map(function(model)
    {
      listEl.append(this.listItemTemplate({item: model.toTemplateData()}));
    }, this);

    if (this.collection.length > 0)
    {
      if (scrollToFirst)
      {
        window.scrollTo(0, lastEl.next().position().top);
      }
    }
    else
    {
      this.$('.more').fadeOut();
    }
  };

  /**
   * @private
   */
  HistoryListView.prototype.showMore = function()
  {
    viewport.msg.loading();

    this.currentPage += 1;

    var self = this;

    this.collection.fetch({
      data: {
        page: this.currentPage,
        fields: ['zoneName', 'programName', 'finishedAt', 'finishState']
      },
      success: function(collection)
      {
        viewport.msg.hide();

        self.appendCollection(true);
      },
      error: function()
      {
        viewport.msg.loadingFailed();
      }
    });
  };

  /**
   * @private
   */
  HistoryListView.prototype.onPurge = function()
  {
    viewport.msg.loading();

    this.currentPage = 0;

    var self = this;

    this.collection.fetch({
      data: {
        fields: ['zoneName', 'programName', 'finishedAt', 'finishState']
      },
      success: function()
      {
        viewport.msg.hide();

        self.render();
      },
      error: function()
      {
        viewport.msg.loadingFailed();
      }
    });
  };

  return HistoryListView;
});
