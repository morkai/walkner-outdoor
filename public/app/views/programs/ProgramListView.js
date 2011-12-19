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

    title: 'Programy',

    className: 'programs',

    breadcrumbs: ['Programy'],

    actions: [{href: '#programs;add', text: 'Dodaj'}]

  });
});
