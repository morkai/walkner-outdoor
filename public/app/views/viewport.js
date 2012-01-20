define(
[
  'require',
  'jQuery',
  'Underscore',
  'Backbone',

  'app/views/Layout',
  'app/views/MessageView'
],
function(require, $, _, Backbone, Layout, MessageView)
{
  return new (Backbone.View.extend({

    el: 'body',

    initialize: function(options)
    {
      _.bindAll(this, 'closeDialog', 'onEscPressCloseDialog');

      this.msg = new MessageView();
      this.layout = null;
      this.view = null;
      this.dialog = null;
      this.dialogQueue = [];
    },

    destroy: function()
    {
      _.destruct(this, 'msg', 'layout', 'view', 'dialog', 'dialogQueue');
    },

    render: function()
    {
      this.renderMessage();
      this.renderLayout(Layout);

      return this;
    },

    showView: function(newView)
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
    },

    showDialog: function(dialogView)
    {
      if (this.dialog)
      {
        this.dialogQueue.push(dialogView);

        return this;
      }

      this.dialog = dialogView.render();

      this.getDialogContainer().append(this.dialog.el).show();

      var closeDialog = this.closeDialog;

      $(this.dialog.el).on('click', '.cancel', function()
      {
        closeDialog();

        return false;
      });
      $(document).on('keyup', this.onEscPressCloseDialog);

      this.msg.trigger('change:view');
      this.trigger('dialog:show');

      return this;
    },

    renderView: function()
    {
      this.renderLayout(this.view.layout).renderView(this.view);
    },

    renderLayout: function(layout)
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
    },

    renderMessage: function()
    {
      $(this.el).append(this.msg.render().el);
    },

    closeDialog: function()
    {
      if (!this.dialog)
      {
        return;
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
    },

    getDialogContainer: function()
    {
      var container = this.$('.dialog');

      if (container.length)
      {
        return container.first();
      }

      return $('<div class="dialog"></div>').hide().appendTo(this.el);
    },

    onEscPressCloseDialog: function(e)
    {
      if (e.keyCode !== 27)
      {
        return true;
      }

      this.closeDialog();

      return false;
    }

  }));
});
