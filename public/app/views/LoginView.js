define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/views/viewport',
  'app/views/PageLayout',

  'text!app/templates/loginForm.html'
],
/**
 * @param {jQuery} $
 * @param {Underscore} _
 * @param {Backbone} Backbone
 * @param {Viewport} viewport
 * @param {function(new:PageLayout)} PageLayout
 * @param {String} loginFormTpl
 */
function($, _, Backbone, viewport, PageLayout, loginFormTpl)
{
  /**
   * @class LoginView
   * @constructor
   * @extends Backbone.View
   * @param {Object} [options]
   */
  var LoginView = Backbone.View.extend({
    helpHash: 'users-auth',
    template: _.template(loginFormTpl),
    layout: PageLayout,
    className: 'login',
    breadcrumbs: ['Logowanie'],
    events: {
      'submit form': 'onFormSubmit'
    }
  });

  /**
   * @return {LoginView}
   */
  LoginView.prototype.render = function()
  {
    this.el.innerHTML = this.template();

    return this;
  };

  /**
   * @private
   * @return {Boolean}
   */
  LoginView.prototype.onFormSubmit = function()
  {
    var formEl = this.$('form');

    $.ajax({
      type: formEl.attr('method'),
      url: formEl.attr('action'),
      data: formEl.toObject(),
      success: function()
      {
        window.location.reload();
      },
      error: function()
      {
        viewport.msg.show({
          type: 'error',
          time: 3000,
          text: 'Nieprawidłowy login i/lub hasło.'
        })
      }
    });

    return false;
  };

  return LoginView;
});
