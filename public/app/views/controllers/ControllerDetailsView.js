define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/views/PageLayout',
  'app/views/viewport',
  'app/views/controllers/DeleteControllerView',

  'text!app/templates/controllers/details.html'
],
function($, _, Backbone, PageLayout, viewport, DeleteControllerView, detailsTpl)
{
  var renderDetails = _.template(detailsTpl);

  return Backbone.View.extend({

    layout: PageLayout,

    breadcrumbs: function()
    {
      return [
        {href: '#controllers', text: 'Sterowniki'},
        this.model.get('name')
      ];
    },
    actions: function()
    {
      var model = this.model;
      var id    = model.get('_id');

      return [
        {href: '#controllers/' + id + ';edit', text: 'Edytuj'},
        {href: '#controllers/' + id + ';delete', text: 'Usuń', handler: function(e)
        {
          if (e.button !== 0) return;

          viewport.showDialog(new DeleteControllerView({model: model}));

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
        controller: this.model.toTemplateData()
      });

      return this;
    }

  });
});
