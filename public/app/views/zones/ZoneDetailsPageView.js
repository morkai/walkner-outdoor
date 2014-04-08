// Copyright (c) 2014, Łukasz Walukiewicz <lukasz@walukiewicz.eu>. Some Rights Reserved.
// Licensed under CC BY-NC-SA 4.0 <http://creativecommons.org/licenses/by-nc-sa/4.0/>.
// Part of the walkner-outdoor project <http://lukasz.walukiewicz.eu/p/walkner-outdoor>

define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/user',
  'app/models/History',
  'app/views/viewport',
  'app/views/PageLayout',
  'app/views/history/HistoryEntriesTableView',
  'app/views/zones/ZoneDetailsView',
  'app/views/zones/DeleteZoneView',

  'text!app/templates/zones/detailsPage.html'
],
/**
 * @param {jQuery} $
 * @param {Underscore} _
 * @param {Backbone} Backbone
 * @param {Object} user
 * @param {Object} History
 * @param {Viewport} viewport
 * @param {function(new:PageLayout)} PageLayout
 * @param {function(new:HistoryEntriesTableView)} HistoryEntriesTableView
 * @param {function(new:ZoneDetailsView)} ZoneDetailsView
 * @param {function(new:DeleteZoneView)} DeleteZoneView
 * @param {String} detailsPageTpl
 */
function(
  $,
  _,
  Backbone,
  user,
  History,
  viewport,
  PageLayout,
  HistoryEntriesTableView,
  ZoneDetailsView,
  DeleteZoneView,
  detailsPageTpl)
{
  /**
   * @class ZoneDetailsPageView
   * @constructor
   * @extends Backbone.View
   * @param {Object} [options]
   */
  var ZoneDetailsPageView = Backbone.View.extend({
    helpHash: 'zones-view',
    className: 'zoneDetailsPage',
    template: _.template(detailsPageTpl),
    layout: PageLayout,
    breadcrumbs: function()
    {
      return [
        {href: '#zones', text: 'Strefy'},
        this.model.get('name')
      ];
    },
    actions: function()
    {
      var model = this.model;
      var id = model.id;

      return [
        {
          href: '#zones/' + id + ';program',
          text: 'Programuj',
          privileges: 'assignPrograms'
        },
        {
          href: '#zones/' + id + ';edit',
          text: 'Edytuj',
          privileges: 'manageZones'
        },
        {
          href: '#zones/' + id + ';delete',
          text: 'Usuń',
          privileges: 'manageZones',
          handler: function(e)
          {
            if (e.button !== 0)
            {
              return;
            }

            viewport.showDialog(new DeleteZoneView({model: model}));

            return false;
          }
        }
      ];
    }
  });

  ZoneDetailsPageView.prototype.initialize = function()
  {
    this.detailsView = null;
    this.historyView = null;
  };

  ZoneDetailsPageView.prototype.destroy = function()
  {
    _.destruct(this, 'detailsView', 'historyView');

    this.remove();
  };

  ZoneDetailsPageView.prototype.render = function()
  {
    _.destruct(this, 'detailsView', 'historyView');

    this.el.innerHTML = this.template();

    this.detailsView = new ZoneDetailsView({model: this.model});
    this.detailsView.render();

    this.$('.details').append(this.detailsView.el);

    var historyEl = this.$('.history').hide();

    if (user.isAllowedTo('viewHistory'))
    {
      var history = new History();
      var self = this;

      history.fetch({
        data: {
          page: 1,
          limit: 5,
          conditions: {zoneId: this.model.id},
          fields: {
            programName: 1,
            startedAt: 1,
            finishedAt: 1,
            finishState: 1
          }
        },
        success: function()
        {
          if (!history.length)
          {
            return;
          }

          self.historyView = new HistoryEntriesTableView({
            showZoneName: false,
            collection: history
          });
          self.historyView.render();

          self.$('.history').append(self.historyView.el).show();
        }
      });
    }

    return this;
  };

  return ZoneDetailsPageView;
});
