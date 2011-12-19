define(
[
  'jQuery',
  'Underscore',
  'Backbone'
],
function($, _, Backbone)
{
  return Backbone.View.extend({

    id: 'logout',

    render: function()
    {
      this.el.innerHTML = '<p>Logout...</p>';

      return this;
    }

  });
});
