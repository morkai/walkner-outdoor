define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'text!app/templates/delete.html'
],
/**
 * @param {jQuery} $
 * @param {Underscore} _
 * @param {Backbone} Backbone
 * @param {String} deleteTpl
 */
function($, _, Backbone, deleteTpl)
{
  /**
   * @class DeleteView
   * @constructor
   * @extends Backbone.View
   * @param {Object} [options]
   */
  var DeleteView = Backbone.View.extend({
    template: _.template(deleteTpl),
    className: 'delete-confirm'
  });

  /**
   * @return {DeleteView}
   */
  DeleteView.prototype.render = function()
  {
    var message = _.isFunction(this.message)
      ? this.message() : this.message;

    var cancelUrl = _.isFunction(this.cancelUrl)
      ? this.cancelUrl() : (this.cancelUrl || '#');

    this.el.innerHTML = this.template({
      message: message,
      cancelUrl: cancelUrl
    });

    return this;
  };

  return DeleteView;
});
