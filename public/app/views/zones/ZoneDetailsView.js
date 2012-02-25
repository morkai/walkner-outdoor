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
/**
 * @param {jQuery} $
 * @param {Underscore} _
 * @param {Backbone} Backbone
 * @param {Viewport} viewport
 * @param {function(new:PageLayout)} PageLayout
 * @param {function(new:DeleteZoneView)} DeleteZoneView
 * @param {String} detailsTpl
 */
function($, _, Backbone, viewport, PageLayout, DeleteZoneView, detailsTpl)
{
  /**
   * @class ZoneDetailsView
   * @constructor
   * @extends Backbone.View
   * @param {Object} [options]
   */
  var ZoneDetailsView = Backbone.View.extend({
    helpHash: 'zones-view',
    template: _.template(detailsTpl),
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
      var id = model.id;

      return [
        {
          href: '#zones/' + id + ';program',
          text: 'Programuj',
          privileges: 'assignPrograms'
        },
        {
          href: '#zones/' + id + ';edit',
          text: 'Edytuj',
          privileges: 'manageZones'
        },
        {
          href: '#zones/' + id + ';delete',
          text: 'Usuń',
          privileges: 'manageZones',
          handler: function(e)
          {
            if (e.button !== 0)
            {
              return;
            }

            viewport.showDialog(new DeleteZoneView({model: model}));

            return false;
          }
        }
      ];
    }
  });

  ZoneDetailsView.prototype.destroy = function()
  {
    this.remove();
  };

  ZoneDetailsView.prototype.render = function()
  {
    this.el.innerHTML = this.template({
      zone: this.model.toTemplateData()
    });

    return this;
  };

  return ZoneDetailsView;
});
