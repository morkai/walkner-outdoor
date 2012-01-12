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

    title: 'Strefy',

    className: 'zones',

    breadcrumbs: ['Strefy'],

    actions: [
      {
        href      : '#zones;add',
        text      : 'Dodaj',
        className : 'blue add-zone action',
        privilages: 'manageZones'
      }
    ],

    render: function()
    {
      ListView.prototype.render.call(this);

      if (this.collection.length >= limits.maxZones)
      {
        this.disableAddAction();
      }

      return this;
    },

    disableAddAction: function()
    {
      var addAction = $('.add-zone.action').first();

      addAction.addClass('disabled');
      addAction.click(function()
      {
        viewport.msg.show({
          type: 'error',
          text: 'Nie można dodać strefy. Maksymalna ilość stref została osiągnięta.',
          time: 4000
        });

        return false;
      });
    }

  });
});
