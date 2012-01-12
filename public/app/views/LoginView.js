define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/views/viewport',
  'app/views/PageLayout',

  'text!app/templates/loginForm.html'
],
function($, _, Backbone, viewport, PageLayout, loginFormTpl)
{
  var renderLoginForm = _.template(loginFormTpl);

  return Backbone.View.extend({

    layout: PageLayout,

    className: 'login',

    breadcrumbs: ['Logowanie'],

    events: {
      'submit form': 'onFormSubmit'
    },

    render: function()
    {
      this.el.innerHTML = renderLoginForm();

      return this;
    },

    onFormSubmit: function()
    {
      var formEl = this.$('form');

      $.ajax({
        type   : formEl.attr('method'),
        url    : formEl.attr('action'),
        data   : formEl.toObject(),
        success: function()
        {
          window.location.reload();
        },
        error  : function()
        {
          viewport.msg.show({
            type: 'error',
            time: 3000,
            text: 'Nieprawidłowy login i/lub hasło.'
          })
        }
      });

      return false;
    }

  });
});
