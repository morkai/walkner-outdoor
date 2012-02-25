define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/views/viewport',
  'app/views/PageLayout',
  'app/views/controllers/DeleteControllerView',

  'text!app/templates/controllers/details.html'
],
/**
 * @param {jQuery} $
 * @param {Underscore} _
 * @param {Backbone} Backbone
 * @param {Viewport} viewport
 * @param {function(new:PageLayout)} PageLayout
 * @param {function(new:ListView)} DeleteControllerView
 * @param {String} detailsTpl
 */
function($, _, Backbone, viewport, PageLayout, DeleteControllerView, detailsTpl)
{
  /**
   * @class ControllerDetailsView
   * @extends Backbone.View
   * @constructor
   * @param {Object} [options]
   */
  var ControllerDetailsView = Backbone.View.extend({
    helpHash: 'controllers-view',
    template: _.template(detailsTpl),
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
      var id = model.id;

      return [
        {
          href: '#controllers/' + id + ';edit',
          text: 'Edytuj',
          privileges: 'manageControllers'
        },
        {
          href: '#controllers/' + id + ';delete',
          text: 'Usuń',
          privileges: 'manageControllers',
          handler: function(e)
          {
            if (e.button !== 0)
            {
              return;
            }

            viewport.showDialog(new DeleteControllerView({model: model}));

            return false;
          }
        }
      ];
    }
  });

  ControllerDetailsView.prototype.destroy = function()
  {
    this.remove();
  };

  ControllerDetailsView.prototype.render = function()
  {
    this.el.innerHTML = this.template({
      controller: this.model.toTemplateData()
    });

    return this;
  };

  return ControllerDetailsView;
});
