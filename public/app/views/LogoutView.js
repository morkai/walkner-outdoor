define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/views/PageLayout',

  'text!app/templates/logoutForm.html'
],
/**
 * @param {jQuery} $
 * @param {Underscore} _
 * @param {Backbone} Backbone
 * @param {function(new:PageLayout)} PageLayout
 * @param {String} logoutFormTpl
 */
function($, _, Backbone, PageLayout, logoutFormTpl)
{
  /**
   * @class LogoutView
   * @constructor
   * @extends Backbone.View
   * @param {Object} [options]
   */
  var LogoutView = Backbone.View.extend({
    helpHash: 'users-auth',
    template: _.template(logoutFormTpl),
    layout: PageLayout,
    className: 'logout',
    breadcrumbs: ['Wylogowywanie']
  });

  /**
   * @return {LogoutView}
   */
  LogoutView.prototype.render = function()
  {
    this.el.innerHTML = this.template();

    return this;
  };

  return LogoutView;
});
