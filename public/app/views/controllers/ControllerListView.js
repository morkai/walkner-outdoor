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

    title: 'Sterowniki',

    className: 'controllers',

    breadcrumbs: ['Sterowniki'],

    actions: [{href: '#controllers;add', text: 'Dodaj'}]

  });
});
