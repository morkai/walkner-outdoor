// Copyright (c) 2014, Łukasz Walukiewicz <lukasz@walukiewicz.eu>. Some Rights Reserved.
// Licensed under CC BY-NC-SA 4.0 <http://creativecommons.org/licenses/by-nc-sa/4.0/>.
// Part of the walkner-outdoor project <http://lukasz.walukiewicz.eu/p/walkner-outdoor>

define(
[
  'require',
  'jQuery',
  'Underscore',
  'Backbone',

  'app/user',
  'app/touch',

  'text!app/templates/menu.html'
],
/**
 * @param {require} require
 * @param {jQuery} $
 * @param {Underscore} _
 * @param {Backbone} Backbone
 * @param {Object} user
 * @param {Object} touch
 * @param {String} menuTpl
 */
function(require, $, _, Backbone, user, touch, menuTpl)
{
  /**
   * @class MenuView
   * @constructor
   * @extends Backbone.View
   * @param {Object} [options]
   */
  var MenuView = Backbone.View.extend({
    template: _.template(menuTpl),
    tagName: 'ul',
    className: 'menu',
    events: {
      'click .login-link': 'onLoginLinkClick',
      'click .logout-link': 'onLogoutLinkClick',
      'click .refresh-link': 'onRefreshLinkClick',
      'click .help-link': 'onHelpLinkClick',
      'click .back-link': 'onBackLinkClick'
    }
  });

  MenuView.prototype.initialize = function()
  {
    _.bindAll(this, 'onLoadChangeActiveMenuItem');
  };

  MenuView.prototype.destroy = function()
  {
    Backbone.history.unbind('load', this.onLoadChangeActiveMenuItem);

    $(this.el).detach();
  };

  /**
   * @return {MenuView}
   */
  MenuView.prototype.render = function()
  {
    Backbone.history.bind('load', this.onLoadChangeActiveMenuItem);

    if ($(this.el).is(':empty'))
    {
      this.el.innerHTML = this.template();
    }

    this.toggleLinks();

    return this;
  };

  /**
   * @private
   */
  MenuView.prototype.toggleLinks = function()
  {
    this.$('li').hide();

    this.showLink('dashboard');
    this.showLink('help');

    if (user.isLoggedIn())
    {
      this.showLink('logout');
    }
    else
    {
      this.showLink('login');
    }

    if (touch.enabled)
    {
      this.showLink('back');
      this.showLink('refresh');
    }

    this.showLinkIfAllowedTo('history', 'viewHistory');
    this.showLinkIfAllowedTo('programs', 'viewPrograms');
    this.showLinkIfAllowedTo('zones', 'viewZones');
    this.showLinkIfAllowedTo('controllers', 'viewControllers');
    this.showLinkIfAllowedTo('users', 'viewUsers');
    this.showLinkIfAllowedTo('diag', 'diag');

    this.showGatewayLink();
  };

  /**
   * @private
   */
  MenuView.prototype.showGatewayLink = function()
  {
    if (user.gatewayUrl === null)
    {
      return;
    }

    this.showLink('gateway').find('a').attr('href', user.gatewayUrl);
  };

  /**
   * @private
   * @param {String} link
   * @param {String} privilege
   */
  MenuView.prototype.showLinkIfAllowedTo = function(link, privilege)
  {
    if (user.isAllowedTo(privilege))
    {
      this.showLink(link);
    }
  };

  /**
   * @private
   * @param {String} link
   * @return {jQuery}
   */
  MenuView.prototype.showLink = function(link)
  {
    return this.$('.' + link + '-link').css('display', 'inline-block');
  };

  /**
   * @private
   * @param {String} fragment
   */
  MenuView.prototype.onLoadChangeActiveMenuItem = function(fragment)
  {
    var module = fragment.split('/')[0];
    var links = this.$('a');

    this.$('.active').removeClass('active');

    for (var i = 0, l = links.length; i < l; ++i)
    {
      var href = links[i].href;
      var frag = href.substring(href.indexOf('#') + 1);

      var match = false;

      if (frag === '')
      {
        match = module === '';
      }
      else if (module.indexOf(frag) === 0)
      {
        match = /^[a-zA-Z0-9_-]$/.test(module[frag.length]) === false;
      }

      if (match)
      {
        $(links[i]).closest('li').addClass('active');

        break;
      }
    }
  };

  /**
   * @private
   * @return {Boolean}
   */
  MenuView.prototype.onLoginLinkClick = function()
  {
    require(
      ['app/views/viewport', 'app/views/LoginView'],
      function(viewport, LoginView)
      {
        viewport.showDialog(new LoginView());
      }
    );

    return false;
  };

  /**
   * @private
   * @return {Boolean}
   */
  MenuView.prototype.onLogoutLinkClick = function()
  {
    require(
      ['app/views/viewport', 'app/views/LogoutView'],
      function(viewport, LogoutView)
      {
        viewport.showDialog(new LogoutView());
      }
    );

    return false;
  };

  /**
   * @private
   * @return {Boolean}
   */
  MenuView.prototype.onRefreshLinkClick = function()
  {
    window.location.reload();

    return false;
  };

  /**
   * @private
   * @return {Boolean}
   */
  MenuView.prototype.onHelpLinkClick = function(e)
  {
    require(
      ['app/views/viewport'],
      function(viewport)
      {
        var href = e.target.href + '?' + encodeURIComponent(window.location.hash.substr(1));

        if (viewport.view && viewport.view.helpHash)
        {
          href += '#' + viewport.view.helpHash;
        }

        window.location.href = href;
      }
    );

    return false;
  };

  /**
   * @private
   * @return {Boolean}
   */
  MenuView.prototype.onBackLinkClick = function(e)
  {
    window.history.back();

    return false;
  };

  return MenuView;
});
