define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/views/viewport',
  'app/views/PageLayout',
  'app/views/users/DeleteUserView',

  'text!app/templates/users/details.html'
],
/**
 * @param {jQuery} $
 * @param {Underscore} _
 * @param {Backbone} Backbone
 * @param {Viewport} viewport
 * @param {function(new:PageLayout)} PageLayout
 * @param {function(new:DeleteUserView)} DeleteUserView
 * @param {String} detailsTpl
 */
function($, _, Backbone, viewport, PageLayout, DeleteUserView, detailsTpl)
{
  /**
   * @class UserDetailsView
   * @constructor
   * @extends Backbone.View
   * @param {Object} [options]
   */
  var UserDetailsView = Backbone.View.extend({
    helpHash: 'users-view',
    template: _.template(detailsTpl),
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
      var id = model.id;

      return [
        {
          href: '#users/' + id + ';edit',
          text: 'Edytuj',
          privileges: 'manageUsers'
        },
        {
          href: '#users/' + id + ';delete',
          text: 'Usuń',
          privileges: 'manageUsers',
          handler: function(e)
          {
            if (e.button !== 0)
            {
              return;
            }

            viewport.showDialog(new DeleteUserView({model: model}));

            return false;
          }
        }
      ];
    }
  });

  UserDetailsView.prototype.destroy = function()
  {
    this.remove();
  };

  UserDetailsView.prototype.render = function()
  {
    this.el.innerHTML = this.template({
      user: this.model.toTemplateData()
    });

    return this;
  };

  return UserDetailsView;
});
