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
  var renderList     = _.template(listTpl);
  var renderListItem = _.template(listItemTpl);

  return Backbone.View.extend({

    layout: PageLayout,

    title: 'Historia',

    className: 'history',

    breadcrumbs: ['Historia'],

    actions: [
      {
        href      : '#history;purge',
        text      : 'Wyczyść',
        className : 'blue purge-history action',
        privileges: 'purgeHistory',
        handler   : function(e)
        {
          if (e.button !== 0) return;

          viewport.showDialog(new PurgeHistoryFormView());

          return false;
        }
      }
    ],

    events: {
      'click .more': 'showMore'
    },

    initialize: function(options)
    {
      this.currentPage = options.page || 1;
    },

    render: function()
    {
      this.el.innerHTML = renderList({
        showList      : this.collection.length > 0,
        showMoreButton: this.collection.length >= 10
      });

      this.appendCollection();

      return this;
    },

    appendCollection: function(scrollToFirst)
    {
      var listEl = this.$('.list');
      var lastEl = listEl.children().last();

      this.collection.map(function(model)
      {
        listEl.append(renderListItem({item: model.toTemplateData()}));
      });

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
    },

    showMore: function()
    {
      viewport.msg.loading();

      this.currentPage += 1;

      var self = this;

      this.collection.fetch({
        data: {
          page  : this.currentPage,
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
    }

  });
});
