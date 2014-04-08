// Copyright (c) 2014, Łukasz Walukiewicz <lukasz@walukiewicz.eu>. Some Rights Reserved.
// Licensed under CC BY-NC-SA 4.0 <http://creativecommons.org/licenses/by-nc-sa/4.0/>.
// Part of the walkner-outdoor project <http://lukasz.walukiewicz.eu/p/walkner-outdoor>

define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/views/viewport',

  'text!app/templates/enterPinForm.html'
],
/**
 * @param {jQuery} $
 * @param {Underscore} _
 * @param {Backbone} Backbone
 * @param {Viewport} viewport
 * @param {String} enterPinFormTpl
 */
function(
  $,
  _,
  Backbone,
  viewport,
  enterPinFormTpl)
{
  /**
   * @class EnterPinFormView
   * @constructor
   * @extends Backbone.View
   * @param {Object} [options]
   */
  var EnterPinFormView = Backbone.View.extend({
    template: _.template(enterPinFormTpl.replace(/\n/g, '')),
    className: 'enterPinForm',
    events: {
      'submit form': 'onSubmit',
      'click .key': 'onKeyClick'
    }
  });

  EnterPinFormView.prototype.initialize = function()
  {
    this.starTimeout = null;
  };

  EnterPinFormView.prototype.destroy = function()
  {
    this.remove();
  };

  EnterPinFormView.prototype.render = function()
  {
    this.el.innerHTML = this.template(this.model);

    return this;
  };

  /**
   * @param {String} pin
   */
  EnterPinFormView.prototype.onPinEnter = function(pin) {};

  /**
   * @private
   * @param {Object} e
   */
  EnterPinFormView.prototype.onKeyClick = function(e)
  {
    var pinDisplayEl = this.$('.pin');
    var pinValueEl = this.$('input[name="pin"]');
    var key = e.target.value;

    if (key === 'x')
    {
      clearTimeout(this.starTimeout);

      pinDisplayEl.val('');
      pinValueEl.val('');

      return;
    }

    var pinDisplay = pinDisplayEl.val();
    var pinValue = pinValueEl.val();

    if (key === '\u2190')
    {
      if (pinValue.length)
      {
        clearTimeout(this.starTimeout);

        pinDisplayEl.val(pinDisplay.substr(0, pinDisplay.length - 1));
        pinValueEl.val(pinValue.substr(0, pinValue.length - 1));
      }

      return;
    }

    if (pinValue.length === 6)
    {
      return;
    }

    clearTimeout(this.starTimeout);

    var stars = '';

    for (var i = 0, l = pinValue.length; i < l; ++i)
    {
      stars += '*';
    }

    pinValueEl.val(pinValue + key);
    pinDisplayEl.val(stars + key);

    this.starTimeout = setTimeout(
      function() { pinDisplayEl.val(stars + '*'); }, 500
    );
  };

  /**
   * @private
   * @param {Object} e
   */
  EnterPinFormView.prototype.onSubmit = function(e)
  {
    e.preventDefault();

    var pin = $.trim(this.$('input[name="pin"]').val());

    if (pin === '')
    {
      viewport.msg.show({
        type: 'error',
        time: 2000,
        text: 'PIN jest wymagany.'
      });
    }
    else
    {
      this.onPinEnter(pin);
    }
  };

  return EnterPinFormView;
});
