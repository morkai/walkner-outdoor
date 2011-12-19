define(
[
  'Backbone',

  'app/views/viewport'
],
function(Backbone, viewport)
{
  return function(text)
  {
    viewport.msg.show({
      type: 'error',
      text: text || 'W budowie...',
      time: 2000
    });

    Backbone.history.back();
  };
});
