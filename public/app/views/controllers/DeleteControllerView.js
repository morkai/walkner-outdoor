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
      return '#controllers/' + this.model.get('_id');
    },

    message: function()
    {
      return '<p>Czy na pewno chcesz nieodwracalnie usunąć sterownik &lt;' +
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
            text: 'Sterownik został usunięty pomyślnie!'
          });

          Backbone.history.navigate('controllers', true);
        },
        error: function()
        {
          viewport.closeDialog();
          viewport.msg.show({
            type: 'error',
            time: 5000,
            text: 'Nie udało się usunąć sterownika :('
          });
        }
      });
    }

  });
});
