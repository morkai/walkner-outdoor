define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'text!app/templates/menu.html'
],
function($, _, Backbone, menuTpl)
{
  var renderMenu = _.template(menuTpl);

  return Backbone.View.extend({

    tagName: 'ul',

    className: 'menu',

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

      return this;
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
    }

  });
});
