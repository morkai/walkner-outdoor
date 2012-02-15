define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/views/menu',

  'text!app/templates/layout.html'
],
/**
 * @param {jQuery} $
 * @param {Underscore} _
 * @param {Backbone} Backbone
 * @param {MenuView} menu
 * @param {String} layoutTpl
 */
function($, _, Backbone, menu, layoutTpl)
{
  /**
   * @class Layout
   * @constructor
   * @extends Backbone.View
   * @param {Object} [options]
   */
  var Layout = Backbone.View.extend({
    template: _.template(layoutTpl),
    className: 'layout'
  });

  Layout.prototype.initialize = function()
  {
    this.menu = menu;
  };

  Layout.prototype.destroy = function()
  {
    this.menu.destroy();
    this.remove();
  };

  /**
   * @return {Layout}
   */
  Layout.prototype.render = function()
  {
    this.el.innerHTML = this.template();

    this.$('.menu').first().replaceWith(this.menu.render().el);

    return this;
  };

  /**
   * @param {Backbone.View} view
   * @return {Layout}
   */
  Layout.prototype.renderView = function(view)
  {
    this.$('.bd').first().empty().append(view.render().el);

    return this;
  };

  return Layout;
});
