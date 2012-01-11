define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/views/PageLayout',
  'app/views/DeleteView',
  'app/views/viewport'
],
function($, _, Backbone, PageLayout, DeleteView, viewport)
{
  return DeleteView.extend({

    events: {
      'click .yes.action': 'onButtonClickHandleDelete'
    },

    cancelUrl: function()
    {
      return '#users/' + this.model.get('_id');
    },

    message: function()
    {
      return '<p>Czy na pewno chcesz nieodwracalnie usunąć użytkownika &lt;' +
             this.model.get('name') + '&gt;?</p>';
    },

    onButtonClickHandleDelete: function()
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
    }

  });
});
