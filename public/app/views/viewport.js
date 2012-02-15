define(
[
  'require',
  'jQuery',
  'Underscore',
  'Backbone',

  'app/views/Layout',
  'app/views/MessageView'
],
/**
 * @param {require} require
 * @param {jQuery} $
 * @param {Underscore} _
 * @param {Backbone} Backbone
 * @param {function(new:Layout)} Layout
 * @param {function(new:MessageView)} MessageView
 */
function(require, $, _, Backbone, Layout, MessageView)
{
  /**
   * @class Viewport
   * @constructor
   * @extends Backbone.View
   * @param {Object} [options]
   */
  var Viewport = Backbone.View.extend({
    el: 'body',
    events: {
      'click .dialog .cancel': 'closeDialog'
    }
  });

  Viewport.prototype.initialize = function()
  {
    _.bindAll(this, 'closeDialog', 'onEscPressCloseDialog');

    this.msg = new MessageView();
    this.layout = null;
    this.view = null;
    this.dialog = null;
    this.dialogQueue = [];
  };

  Viewport.prototype.destroy = function()
  {
    $(document).off('keyup', this.onEscPressCloseDialog);

    _.destruct(this, 'msg', 'layout', 'view', 'dialog', 'dialogQueue');
  };

  /**
   * @return {Viewport}
   */
  Viewport.prototype.render = function()
  {
    this.renderMessage();
    this.renderLayout(Layout);

    return this;
  };

  /**
   * @param {Backbone.View} newView
   * @return {Viewport}
   */
  Viewport.prototype.showView = function(newView)
  {
    var oldView = this.view;

    if (!this.dialog && oldView === newView)
    {
      return true;
    }

    this.view = newView;

    if (oldView)
    {
      if ('destroy' in oldView)
      {
        oldView.destroy();
      }

      if (_.isElement(oldView.el))
      {
        $(oldView.el).detach();
      }
    }

    this.renderView();
    this.closeDialog();

    this.msg.trigger('change:view');
    this.trigger('change:view');

    return this;
  };

  /**
   * @param {Backbone.View} dialogView
   * @return {Viewport}
   */
  Viewport.prototype.showDialog = function(dialogView)
  {
    if (this.dialog)
    {
      this.dialogQueue.push(dialogView);

      return this;
    }

    this.dialog = dialogView.render();

    this.getDialogContainer().append(this.dialog.el).show();

    $(document).on('keyup', this.onEscPressCloseDialog);

    this.msg.trigger('change:view');
    this.trigger('dialog:show', this.dialog);

    return this;
  };

  /**
   * @param {Object} [e]
   * @return {Viewport}
   */
  Viewport.prototype.closeDialog = function(e)
  {
    if (!this.dialog)
    {
      return this;
    }

    this.getDialogContainer().hide();

    if ('destroy' in this.dialog)
    {
      this.dialog.destroy();
    }

    if (_.isElement(this.dialog.el))
    {
      $(this.dialog.el).detach();
    }

    this.dialog = null;

    this.trigger('dialog:close');

    if (this.dialogQueue.length)
    {
      this.showDialog(this.dialogQueue.shift());
    }
    else
    {
      $(document).off('keyup', this.onEscPressCloseDialog);
    }

    if (e)
    {
      e.preventDefault();
    }

    return this;
  };

  /**
   * @private
   */
  Viewport.prototype.renderView = function()
  {
    this.renderLayout(this.view.layout).renderView(this.view);
  };

  /**
   * @private
   * @param {*} layout
   * @return {Backbone.View}
   */
  Viewport.prototype.renderLayout = function(layout)
  {
    if (this.layout === layout)
    {
      return layout;
    }

    var classOrInstance;
    var options;

    if (layout instanceof Backbone.View)
    {
      classOrInstance = layout;
    }
    else if (_.isFunction(layout))
    {
      classOrInstance = layout;
      options = {};
    }
    else if (_.isObject(layout))
    {
      classOrInstance = layout.type;
      options = layout.options || {};
    }
    else
    {
      classOrInstance = Layout;
      options = {};
    }

    var oldLayout = this.layout;
    var newLayout = classOrInstance instanceof Backbone.View
      ? classOrInstance
      : new classOrInstance(options);

    if (!_.isFunction(newLayout.renderView))
    {
      throw new Error('Layout views must have renderView(view) method');
    }

    oldLayout && oldLayout.destroy && oldLayout.destroy();

    var pageEl = this.$('.page');

    if (pageEl.length === 0)
    {
      pageEl = $('<div class="page"></div>').appendTo(this.el);
    }

    pageEl.append(newLayout.render().el);

    this.layout = newLayout;

    this.trigger('change:layout');

    return this.layout;
  };

  /**
   * @private
   */
  Viewport.prototype.renderMessage = function()
  {
    $(this.el).append(this.msg.render().el);
  };

  /**
   * @private
   * @return {jQuery}
   */
  Viewport.prototype.getDialogContainer = function()
  {
    var container = this.$('.dialog');

    if (container.length)
    {
      return container.first();
    }

    var cancelEl = $('<button>X</button>')
      .addClass('red cancel action')
      .attr('title', 'Zamknij dialog');

    return $('<div class="dialog"></div>')
      .hide()
      .append(cancelEl)
      .appendTo(this.el);
  };

  /**
   * @private
   * @param {Object} e
   * @return {Boolean}
   */
  Viewport.prototype.onEscPressCloseDialog = function(e)
  {
    if (e.keyCode !== 27)
    {
      return true;
    }

    this.closeDialog();

    return false;
  };

  return new Viewport();
});
