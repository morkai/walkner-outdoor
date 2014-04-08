// Copyright (c) 2014, Łukasz Walukiewicz <lukasz@walukiewicz.eu>. Some Rights Reserved.
// Licensed under CC BY-NC-SA 4.0 <http://creativecommons.org/licenses/by-nc-sa/4.0/>.
// Part of the walkner-outdoor project <http://lukasz.walukiewicz.eu/p/walkner-outdoor>

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
