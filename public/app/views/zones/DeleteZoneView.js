define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/views/viewport',
  'app/views/PageLayout',
  'app/views/DeleteView'
],
/**
 * @param {jQuery} $
 * @param {Underscore} _
 * @param {Backbone} Backbone
 * @param {Viewport} viewport
 * @param {function(new:PageLayout)} PageLayout
 * @param {function(new:DeleteView)} DeleteView
 */
function($, _, Backbone, viewport, PageLayout, DeleteView)
{
  /**
   * @class DeleteZoneView
   * @constructor
   * @extends DeleteView
   * @param {Object} [options]
   */
  var DeleteZoneView = DeleteView.extend({
    helpHash: 'zones-delete',
    events: {
      'click .yes.action': 'onButtonClickHandleDelete'
    },
    cancelUrl: function()
    {
      return '#zones/' + this.model.id;
    },
    message: function()
    {
      return '<p>Czy na pewno chcesz nieodwracalnie usunąć strefę &lt;'
        + this.model.get('name') + '&gt;?</p>';
    }
  });

  /**
   * @private
   */
  DeleteZoneView.prototype.onButtonClickHandleDelete = function()
  {
    viewport.msg.loading();

    this.model.destroy({
      success: function()
      {
        viewport.msg.show({
          type: 'success',
          time: 5000,
          text: 'Strefa została usunięta pomyślnie!'
        });

        Backbone.history.navigate('zones', true);
      },
      error: function(zone, xhr)
      {
        viewport.closeDialog();
        viewport.msg.show({
          type: 'error',
          time: 5000,
          text: xhr.responseText || 'Nie udało się usunąć strefy :('
        });
      }
    });
  };

  return DeleteZoneView;
});
