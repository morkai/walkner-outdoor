define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/views/menu',

  'text!app/templates/pageLayout.html',
  'text!app/templates/breadcrumbs.html',
  'text!app/templates/actions.html'
],
function($, _, Backbone, menu, pageLayoutTpl, breadcrumbsTpl, actionsTpl)
{
  var renderPageLayout  = _.template(pageLayoutTpl);
  var renderBreadcrumbs = _.template(breadcrumbsTpl);
  var renderActions     = _.template(actionsTpl);

  return Backbone.View.extend({

    className: 'pageLayout',

    initialize: function(options)
    {
      this.view = null;
      this.menu = menu;
    },

    destroy: function()
    {
      this.view = null
      this.menu.destroy();
      this.remove();
    },

    render: function()
    {
      this.el.innerHTML = renderPageLayout();

      this.$('.menu').first().replaceWith(this.menu.render().el);

      return this;
    },

    renderView: function(view)
    {
      this.renderBreadcrumbs(view);
      this.renderActions(view);

      this.$('.bd').first().empty().append(view.render().el);

      return this;
    },

    renderActions: function(view)
    {
      var actionsEl = this.$('.actions').first();

      if (!_.isFunction(view.actions) && _.isEmpty(view.actions))
      {
        actionsEl.empty().hide();
      }
      else
      {
        var actions = this.prepareActions(
          _.isFunction(view.actions) ? view.actions() : view.actions
        );

        actionsEl.replaceWith(renderActions({actions: actions})).show();

        _.each(actions, function(action)
        {
          if (_.isFunction(action.handler))
          {
            $('#' + action.id).click(action.handler);
          }
        });
      }
    },

    renderBreadcrumbs: function(view)
    {
      var breadcrumbsEl = this.$('.breadcrumbs').first();

      if (!_.isFunction(view.breadcrumbs) && _.isEmpty(view.breadcrumbs))
      {
        breadcrumbsEl.empty().hide();
      }
      else
      {
        var breadcrumbs = this.prepareBreadcrumbs(
          _.isFunction(view.breadcrumbs)
            ? view.breadcrumbs()
            : view.breadcrumbs
        );

        breadcrumbsEl.replaceWith(
          renderBreadcrumbs({breadcrumbs: breadcrumbs})
        ).show();
      }
    },

    prepareActions: function(actions)
    {
      var result = [];

      _.each(actions, function(action)
      {
        var className = _.isUndefined(action.className)
          ? 'blue action'
          : action.className;

        result.push({
          id       : action.id || _.uniqueId('action-'),
          className: className,
          text     : action.text || '',
          href     : action.href,
          type     : action.type || 'button',
          handler  : action.handler
        });
      });

      return result;
    },

    prepareBreadcrumbs: function(breadcrumbs)
    {
      var result = [];

      _.each(breadcrumbs, function(breadcrumb)
      {
        if (_.isString(breadcrumb))
        {
          breadcrumb = {text: breadcrumb};
        }

        if (_.isEmpty(breadcrumb.text))
        {
          return;
        }

        result.push({
          text: breadcrumb.text,
          href: breadcrumb.href
        });
      });

      return result;
    }
  });
});
