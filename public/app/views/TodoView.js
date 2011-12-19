define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/views/MessageView'
],
function($, _, Backbone, MessageView)
{
  return Backbone.View.extend({

    initialize: function()
    {
      this.msg = new MessageView();
    },

    destroy: function()
    {
      this.msg.destroy();
      this.remove();
    },

    render: function()
    {
      $(this.el)
        .html('<p style="text-align: center; padding: 1em; text-shadow: 1px 1px 1px #FFF">TODO</p>')
        .prepend(this.msg.render().el);

      this.msg.show({
        type: 'error',
        text: 'W budowie...'
      });

      return this;
    }

  });
});
