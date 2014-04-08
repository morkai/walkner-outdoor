// Copyright (c) 2014, Łukasz Walukiewicz <lukasz@walukiewicz.eu>. Some Rights Reserved.
// Licensed under CC BY-NC-SA 4.0 <http://creativecommons.org/licenses/by-nc-sa/4.0/>.
// Part of the walkner-outdoor project <http://lukasz.walukiewicz.eu/p/walkner-outdoor>

define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'text!app/templates/dashboard/disconnectedState.html'
],
/**
 * @param {jQuery} $
 * @param {Underscore} _
 * @param {Backbone} Backbone
 * @param {String} disconnectedStateTpl
 */
function($, _, Backbone, disconnectedStateTpl)
{
  /**
   * @class DisconnectedStateView
   * @constructor
   * @extends Backbone.View
   * @param {Object} [options]
   */
  var DisconnectedStateView = Backbone.View.extend({
    tagName: 'div',
    className: 'disconnected',
    template: _.template(disconnectedStateTpl)
  });

  DisconnectedStateView.prototype.destroy = function()
  {
    this.remove();
  };

  /**
   * @return {DisconnectedStateView}
   */
  DisconnectedStateView.prototype.render = function()
  {
    this.el.innerHTML = this.template(this.model.toJSON());

    return this;
  };

  return DisconnectedStateView;
});
