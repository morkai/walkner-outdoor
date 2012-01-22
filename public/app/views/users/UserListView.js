define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/views/PageLayout',
  'app/views/ListView'
],
function($, _, Backbone, PageLayout, ListView)
{
  return ListView.extend({

    layout: PageLayout,

    title: 'Użytkownicy',

    className: 'users',

    breadcrumbs: ['Użytkownicy'],

    actions: [{href: '#users;add', text: 'Dodaj', privileges: 'manageUsers'}]

  });
});
