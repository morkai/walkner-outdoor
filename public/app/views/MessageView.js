define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/user'
],
/**
 * @param {jQuery} $
 * @param {Underscore} _
 * @param {Backbone} Backbone
 * @param {Object} user
 */
function($, _, Backbone, user)
{
  /**
   * @class MessageView
   * @constructor
   * @extends Backbone.View
   * @param {Object} [options]
   */
  var MessageView = Backbone.View.extend({
    className: 'message',
    events: {
      'click': 'hide'
    }
  });

  MessageView.prototype.initialize = function()
  {
    _.bindAll(this, 'hide');

    this.showTimeout = null;
  };

  MessageView.prototype.destroy = function()
  {
    clearTimeout(this.showTimeout);

    this.remove();
  };

  /**
   * @return {MessageView}
   */
  MessageView.prototype.render = function()
  {
    this.el.innerHTML = '';

    return this;
  };

  /**
   * @param {Object} options
   * @return {MessageView}
   */
  MessageView.prototype.show = function(options)
  {
    clearTimeout(this.showTimeout);

    var messageEl = $(this.el);
    var hide = this.hide;

    function show()
    {
      var id = _.uniqueId();

      messageEl
        .attr('data-id', id)
        .removeClass()
        .addClass('message')
        .html('<div>' + options.text + '</div>');

      if (options.type)
      {
        messageEl.addClass(options.type);
      }

      var delay = options.delay || 0;

      if (options.time)
      {
        setTimeout(function()
        {
          if (messageEl.attr('data-id') == id)
          {
            hide();
          }
        }, options.time + delay);
      }

      this.showTimeout = _.timeout(delay, function()
      {
        messageEl.slideDown('fast');
      });
    }

    if (messageEl.is(':visible'))
    {
      messageEl.slideUp('fast', show);
    }
    else
    {
      show();
    }

    return this;
  };

  /**
   * @return {MessageView}
   */
  MessageView.prototype.hide = function()
  {
    clearTimeout(this.showTimeout);

    $(this.el).slideUp('fast');

    return this;
  };

  /**
   * @return {MessageView}
   */
  MessageView.prototype.loading = function()
  {
    var self = this;
    var shown = false;

    this.showTimeout = _.timeout(200, function()
    {
      shown = true;

      self.show({text: 'Ładowanie...'});
    });

    function hide()
    {
      if (shown)
      {
        this.hide();
      }
      else
      {
        clearTimeout(self.showTimeout);
      }

      this.unbind('change:view', hide);
    }

    this.bind('change:view', hide, this);

    return this;
  };

  /**
   * @return {MessageView}
   */
  MessageView.prototype.loadingFailed = function()
  {
    return this.show({
      type: 'error',
      text: 'Ładowanie nie powiodło się :('
    });
  };

  /**
   * @param {String|Array.<String>} privileges
   * @return {Boolean}
   */
  MessageView.prototype.auth = function(privileges)
  {
    if (user.isAllowedTo(privileges))
    {
      return false;
    }

    this.show({
      type: 'error',
      text: 'Brak uprawnień.'
    });

    return true;
  };

  return MessageView;
});
