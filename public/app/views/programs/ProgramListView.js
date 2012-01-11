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
function($, _, Backbone, limits, viewport, PageLayout, ListView)
{
  return ListView.extend({

    layout: PageLayout,

    title: 'Programy',

    className: 'programs',

    breadcrumbs: ['Programy'],

    actions: [
      {href: '#programs;add', text: 'Dodaj', className: 'blue add-program action'}
    ],

    render: function()
    {
      ListView.prototype.render.call(this);

      if (this.collection.length >= limits.maxPrograms)
      {
        this.disableAddAction();
      }

      return this;
    },

    disableAddAction: function()
    {
      var addAction = $('.add-program.action').first();

      addAction.addClass('disabled');
      addAction.click(function()
      {
        viewport.msg.show({
          type: 'error',
          text: 'Nie można dodać programu. Maksymalna ilość programów została osiągnięta.',
          time: 4000
        });

        return false;
      });
    }

  });
});
