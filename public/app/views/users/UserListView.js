// Copyright (c) 2014, Łukasz Walukiewicz <lukasz@walukiewicz.eu>. Some Rights Reserved.
// Licensed under CC BY-NC-SA 4.0 <http://creativecommons.org/licenses/by-nc-sa/4.0/>.
// Part of the walkner-outdoor project <http://lukasz.walukiewicz.eu/p/walkner-outdoor>

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
