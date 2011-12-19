define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/views/menu',

  'text!app/templates/layout.html'
],
function($, _, Backbone, menu, layoutTpl)
{
  var renderLayout = _.template(layoutTpl);

  return Backbone.View.extend({

    className: 'layout',

    initialize: function()
    {
      this.menu = menu;
    },

    destroy: function()
    {
      this.menu.destroy();
      this.remove();
    },

    render: function()
    {
      this.el.innerHTML = renderLayout();

      this.$('.menu').first().replaceWith(this.menu.render().el);

      return this;
    },

    renderView: function(view)
    {
      this.$('.bd').first().empty().append(view.render().el);

      return this;
    }

  });
});
