// Copyright (c) 2014, Łukasz Walukiewicz <lukasz@walukiewicz.eu>. Some Rights Reserved.
// Licensed under CC BY-NC-SA 4.0 <http://creativecommons.org/licenses/by-nc-sa/4.0/>.
// Part of the walkner-outdoor project <http://lukasz.walukiewicz.eu/p/walkner-outdoor>

define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/models/limits',

  'app/views/viewport',
  'app/views/PageLayout',
  'app/views/ListView'
],
/**
 * @param {jQuery} $
 * @param {Underscore} _
 * @param {Backbone} Backbone
 * @param {Object} limits
 * @param {Viewport} viewport
 * @param {function(new:PageLayout)} PageLayout
 * @param {function(new:ListView)} ListView
 */
function($, _, Backbone, limits, viewport, PageLayout, ListView)
{
  /**
   * @class ZoneListView
   * @constructor
   * @extends ListView
   * @param {Object} [options]
   */
  var ZoneListView = ListView.extend({
    helpHash: 'zones-browse',
    layout: PageLayout,
    title: 'Strefy',
    className: 'zones',
    breadcrumbs: ['Strefy'],
    actions: [
      {
        href: '#zones;add',
        text: 'Dodaj',
        className: 'blue add-zone action',
        privileges: 'manageZones'
      }
    ]
  });

  ZoneListView.prototype.render = function()
  {
    ListView.prototype.render.call(this);

    if (this.collection.length >= limits.maxZones)
    {
      this.disableAddAction();
    }

    return this;
  };

  /**
   * @private
   */
  ZoneListView.prototype.disableAddAction = function()
  {
    var addAction = $('.add-zone.action').first();

    addAction.addClass('disabled');
    addAction.click(function()
    {
      viewport.msg.show({
        type: 'error',
        text: 'Nie można dodać strefy. '
          + 'Maksymalna ilość stref została osiągnięta.',
        time: 4000
      });

      return false;
    });
  };

  return ZoneListView;
});
