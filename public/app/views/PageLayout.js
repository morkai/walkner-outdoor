define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/user',
  'app/views/menu',

  'text!app/templates/pageLayout.html',
  'text!app/templates/breadcrumbs.html',
  'text!app/templates/actions.html'
],
/**
 * @param {jQuery} $
 * @param {Underscore} _
 * @param {Backbone} Backbone
 * @param {Object} user
 * @param {MenuView} menu
 * @param {String} pageLayoutTpl
 * @param {String} breadcrumbsTpl
 * @param {String} actionsTpl
 */
function($, _, Backbone, user, menu, pageLayoutTpl, breadcrumbsTpl, actionsTpl)
{
  /**
   * @class PageLayout
   * @constructor
   * @extends Backbone.View
   * @param {Object} [options]
   */
  var PageLayout = Backbone.View.extend({
    pageLayoutTemplate: _.template(pageLayoutTpl),
    breadcrumbsTemplate: _.template(breadcrumbsTpl),
    actionsTemplate: _.template(actionsTpl),
    className: 'pageLayout'
  });

  PageLayout.prototype.initialize = function()
  {
    this.menu = menu;
  };

  PageLayout.prototype.destroy = function()
  {
    this.menu.destroy();
    this.remove();
  };

  PageLayout.prototype.render = function()
  {
    this.el.innerHTML = this.pageLayoutTemplate();

    this.$('.menu').first().replaceWith(this.menu.render().el);

    return this;
  };

  /**
   * @param {Backbone.View} view
   */
  PageLayout.prototype.renderView = function(view)
  {
    this.renderBreadcrumbs(view);
    this.renderActions(view);

    this.$('.bd').first().empty().append(view.render().el);

    return this;
  };

  /**
   * @private
   * @param {Backbone.View} view
   */
  PageLayout.prototype.renderActions = function(view)
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

      actionsEl.replaceWith(this.actionsTemplate({actions: actions})).show();

      _.each(actions, function(action)
      {
        if (_.isFunction(action.handler))
        {
          $('#' + action.id).click(action.handler);
        }
      });
    }
  };

  /**
   * @private
   * @param {Backbone.View} view
   */
  PageLayout.prototype.renderBreadcrumbs = function(view)
  {
    var breadcrumbsEl = this.$('.breadcrumbs').first();

    if (!_.isFunction(view.breadcrumbs) && _.isEmpty(view.breadcrumbs))
    {
      breadcrumbsEl.empty().hide();
    }
    else
    {
      var breadcrumbs = this.prepareBreadcrumbs(
        _.isFunction(view.breadcrumbs) ? view.breadcrumbs() : view.breadcrumbs
      );

      breadcrumbsEl.replaceWith(
        this.breadcrumbsTemplate({breadcrumbs: breadcrumbs})
      ).show();
    }
  };

  /**
   * @private
   * @param {Array.<Object>} actions
   * @return {Array.<Object>}
   */
  PageLayout.prototype.prepareActions = function(actions)
  {
    var result = [];

    _.each(actions, function(action)
    {
      var className = _.isUndefined(action.className)
        ? 'blue action'
        : action.className;

      if (action.privileges && !user.isAllowedTo(action.privileges))
      {
        return;
      }

      result.push({
        id: action.id || _.uniqueId('action-'),
        className: className,
        text: action.text || '',
        href: action.href,
        type: action.type || 'button',
        handler: action.handler
      });
    });

    return result;
  };

  /**
   * @private
   * @param {Array.<Object>} breadcrumbs
   * @return {Array.<Object>}
   */
  PageLayout.prototype.prepareBreadcrumbs = function(breadcrumbs)
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
  };

  return PageLayout;
});
