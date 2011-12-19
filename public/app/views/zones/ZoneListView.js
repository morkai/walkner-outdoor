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

    title: 'Strefy',

    className: 'zones',

    breadcrumbs: ['Strefy'],

    actions: [{href: '#zones;add', text: 'Dodaj'}]

  });
});
