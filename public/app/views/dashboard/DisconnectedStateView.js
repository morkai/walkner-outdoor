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
