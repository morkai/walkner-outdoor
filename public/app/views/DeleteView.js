define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'text!app/templates/delete.html'
],
function($, _, Backbone, deleteTpl)
{
  var renderDelete = _.template(deleteTpl);

  return Backbone.View.extend({

    className: 'delete-confirm',

    render: function()
    {
      var message = _.isFunction(this.message)
        ? this.message()
        : this.message;

      var cancelUrl = _.isFunction(this.cancelUrl)
        ? this.cancelUrl()
        : (this.cancelUrl || '#');

      this.el.innerHTML = renderDelete({
        message  : message,
        cancelUrl: cancelUrl
      });

      return this;
    }

  });
});
