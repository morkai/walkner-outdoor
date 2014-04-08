// Copyright (c) 2014, Łukasz Walukiewicz <lukasz@walukiewicz.eu>. Some Rights Reserved.
// Licensed under CC BY-NC-SA 4.0 <http://creativecommons.org/licenses/by-nc-sa/4.0/>.
// Part of the walkner-outdoor project <http://lukasz.walukiewicz.eu/p/walkner-outdoor>

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
