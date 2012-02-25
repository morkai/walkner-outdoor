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
   * @class DeleteUserView
   * @constructor
   * @extends DeleteView
   * @param {Object} [options]
   */
  var DeleteUserView = DeleteView.extend({
    helpHash: 'users-delete',
    events: {
      'click .yes.action': 'onButtonClickHandleDelete'
    },
    cancelUrl: function()
    {
      return '#users/' + this.model.id;
    },
    message: function()
    {
      return '<p>Czy na pewno chcesz nieodwracalnie usunąć użytkownika &lt;'
        + this.model.get('name') + '&gt;?</p>';
    }
  });

  /**
   * @private
   */
  DeleteUserView.prototype.onButtonClickHandleDelete = function()
  {
    viewport.msg.loading();

    this.model.destroy({
      success: function()
      {
        viewport.msg.show({
          type: 'success',
          time: 5000,
          text: 'Użytkownik został usunięty pomyślnie!'
        });

        Backbone.history.navigate('users', true);
      },
      error: function()
      {
        viewport.closeDialog();
        viewport.msg.show({
          type: 'error',
          time: 5000,
          text: 'Nie udało się usunąć użytkownika :('
        });
      }
    });
  };

  return DeleteUserView;
});
