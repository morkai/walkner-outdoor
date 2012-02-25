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
   * @class DeleteProgramView
   * @constructor
   * @extends DeleteView
   * @param {Object} [options]
   */
  var DeleteProgramView = DeleteView.extend({
    helpHash: 'programs-delete',
    events: {
      'click .yes.action': 'onButtonClickHandleDelete'
    },
    cancelUrl: function()
    {
      return '#programs/' + this.model.id;
    },
    message: function()
    {
      return '<p>Czy na pewno chcesz nieodwracalnie usunąć program &lt;'
        + this.model.get('name') + '&gt;?</p>';
    }
  });

  /**
   * @private
   */
  DeleteProgramView.prototype.onButtonClickHandleDelete = function()
  {
    viewport.msg.loading();

    this.model.destroy({
      success: function()
      {
        viewport.msg.show({
          type: 'success',
          time: 5000,
          text: 'Program został usunięty pomyślnie!'
        });

        Backbone.history.navigate('programs', true);
      },
      error: function()
      {
        viewport.closeDialog();
        viewport.msg.show({
          type: 'error',
          time: 5000,
          text: 'Nie udało się usunąć programu :('
        });
      }
    });
  };

  return DeleteProgramView;
});
