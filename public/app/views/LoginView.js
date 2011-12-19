define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'text!app/templates/loginForm.html'
],
function($, _, Backbone, loginFormTpl)
{
  var renderLoginForm = _.template(loginFormTpl);

  return Backbone.View.extend({

    render: function()
    {
      this.el.innerHTML = renderLoginForm();

      return this;
    }

  });
});
