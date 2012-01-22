define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/views/PageLayout',
  'app/views/viewport',
  'app/views/users/DeleteUserView',

  'text!app/templates/users/details.html'
],
function($, _, Backbone, PageLayout, viewport, DeleteUserView, detailsTpl)
{
  var renderDetails = _.template(detailsTpl);

  return Backbone.View.extend({

    layout: PageLayout,

    breadcrumbs: function()
    {
      return [
        {href: '#users', text: 'Użytkownicy'},
        this.model.get('name')
      ];
    },
    actions: function()
    {
      var model = this.model;
      var id    = model.get('_id');

      return [
        {
          href      : '#users/' + id + ';edit',
          text      : 'Edytuj',
          privileges: 'manageUsers'
        },
        {
          href      : '#users/' + id + ';delete',
          text      : 'Usuń',
          privileges: 'manageUsers',
          handler   : function(e)
          {
            if (e.button !== 0) return;

            viewport.showDialog(new DeleteUserView({model: model}));

            return false;
          }
        }
      ];
    },

    destroy: function()
    {
      this.remove();
    },

    render: function()
    {
      this.el.innerHTML = renderDetails({
        user: this.model.toTemplateData()
      });

      return this;
    }

  });
});
