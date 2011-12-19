define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/views/viewport',
  'app/views/PageLayout',
  'app/views/zones/DeleteZoneView',

  'text!app/templates/zones/details.html'
],
function($, _, Backbone, viewport, PageLayout, DeleteZoneView, detailsTpl)
{
  var renderDetails = _.template(detailsTpl);

  return Backbone.View.extend({

    layout: PageLayout,

    className: 'zone-details',

    breadcrumbs: function()
    {
      return [
        {href: '#zones', text: 'Strefy'},
        this.model.get('name')
      ];
    },

    actions: function()
    {
      var model = this.model;
      var id    = model.get('_id');

      return [
        {href: '#zones/' + id + ';edit', text: 'Edytuj'},
        {href: '#zones/' + id + ';delete', text: 'Usuń', handler: function(e)
        {
          if (e.button !== 0) return;

          viewport.showDialog(new DeleteZoneView({model: model}));

          return false;
        }}
      ];
    },

    destroy: function()
    {
      this.remove();
    },

    render: function()
    {
      this.el.innerHTML = renderDetails({
        zone: this.model.toTemplateData()
      });

      return this;
    }

  });
});
