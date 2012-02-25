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
   * @class UserListView
   * @constructor
   * @extends ListView
   * @param {Object} [options]
   */
  var UserListView = ListView.extend({
    helpHash: 'users-browse',
    layout: PageLayout,
    title: 'Użytkownicy',
    className: 'users',
    breadcrumbs: ['Użytkownicy'],
    actions: [{href: '#users;add', text: 'Dodaj', privileges: 'manageUsers'}]
  });

  return UserListView;
});
