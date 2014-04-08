// Copyright (c) 2014, Łukasz Walukiewicz <lukasz@walukiewicz.eu>. Some Rights Reserved.
// Licensed under CC BY-NC-SA 4.0 <http://creativecommons.org/licenses/by-nc-sa/4.0/>.
// Part of the walkner-outdoor project <http://lukasz.walukiewicz.eu/p/walkner-outdoor>

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
