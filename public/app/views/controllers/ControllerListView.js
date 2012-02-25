define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/views/PageLayout',
  'app/views/ListView'
],
/**
 * @param {jQuery} $
 * @param {Underscore} _
 * @param {Backbone} Backbone
 * @param {function(new:PageLayout)} PageLayout
 * @param {function(new:ListView)} ListView
 */
function($, _, Backbone, PageLayout, ListView)
{
  /**
   * @class ControllerListView
   * @extends ListView
   * @constructor
   * @param {Object} [options]
   */
  var ControllerListView = ListView.extend({
    helpHash: 'controllers-browse',
    layout: PageLayout,
    title: 'Sterowniki',
    className: 'controllers',
    breadcrumbs: ['Sterowniki'],
    actions: [
      {
        href: '#controllers;add',
        text: 'Dodaj',
        privileges: 'manageControllers'
      }
    ]
  });

  return ControllerListView;
});
