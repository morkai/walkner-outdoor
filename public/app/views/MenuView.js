define(
[
  'require',
  'jQuery',
  'Underscore',
  'Backbone',

  'app/user',

  'text!app/templates/menu.html'
],
function(require, $, _, Backbone, user, menuTpl)
{
  var renderMenu = _.template(menuTpl);

  return Backbone.View.extend({

    tagName: 'ul',

    className: 'menu',

    events: {
      'click .login-link' : 'onLoginLinkClick',
      'click .logout-link': 'onLogoutLinkClick'
    },

    initialize: function()
    {
      _.bindAll(this, 'onLoadChangeActiveMenuItem');
    },

    destroy: function()
    {
      Backbone.history.unbind('load', this.onLoadChangeActiveMenuItem);

      $(this.el).detach();
    },

    render: function()
    {
      Backbone.history.bind('load', this.onLoadChangeActiveMenuItem);

      if ($(this.el).is(':empty'))
      {
        this.el.innerHTML = renderMenu();
      }

      this.toggleLinks();

      return this;
    },

    toggleLinks: function()
    {
      this.$('li').hide();

      this.$('.dashboard-link').css('display', 'inline-block');

      if (user.isLoggedIn())
      {
        this.$('.logout-link').css('display', 'inline-block');
      }
      else
      {
        this.$('.login-link').css('display', 'inline-block');
      }

      this.showLinkIfAllowedTo('history', 'viewHistory');
      this.showLinkIfAllowedTo('programs', 'viewPrograms');
      this.showLinkIfAllowedTo('zones', 'viewZones');
      this.showLinkIfAllowedTo('controllers', 'viewControllers');
      this.showLinkIfAllowedTo('users', 'viewUsers');
      this.showLinkIfAllowedTo('diag', 'diag');
    },

    showLinkIfAllowedTo: function(link, privilage)
    {
      if (user.isAllowedTo(privilage))
      {
        this.$('.' + link + '-link').css('display', 'inline-block');
      }
    },

    onLoadChangeActiveMenuItem: function(fragment)
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
    },

    onLoginLinkClick: function()
    {
      require(
        ['app/views/viewport', 'app/views/LoginView'],
        function(viewport, LoginView)
        {
          viewport.showDialog(new LoginView());
        }
      );

      return false;
    },

    onLogoutLinkClick: function(e)
    {
      require(
        ['app/views/viewport', 'app/views/LogoutView'],
        function(viewport, LogoutView)
        {
          viewport.showDialog(new LogoutView());
        }
      );

      return false;
    }

  });
});
