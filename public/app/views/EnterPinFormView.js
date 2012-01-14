define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/views/viewport',

  'text!app/templates/enterPinForm.html'
],
function(
  $,
  _,
  Backbone,
  viewport,
  enterPinFormTpl)
{
  var renderEnterPinForm = _.template(enterPinFormTpl.replace(/\n/g, ''));

  return Backbone.View.extend({

    className: 'enterPinForm',

    events: {
      'submit form' : 'onSubmit',
      'click .key'  : 'onKeyClick'
    },

    initialize: function()
    {
      this.starTimeout = null;
    },

    destroy: function()
    {
      this.remove();
    },

    render: function()
    {
      this.el.innerHTML = renderEnterPinForm(this.model);

      return this;
    },

    onKeyClick: function(e)
    {
      var pinDisplayEl = this.$('.pin');
      var pinValueEl   = this.$('input[name="pin"]');
      var key          = e.target.value;

      if (key === 'x')
      {
        clearTimeout(this.starTimeout);

        pinDisplayEl.val('');
        pinValueEl.val('');

        return;
      }

      var pinDisplay = pinDisplayEl.val();
      var pinValue   = pinValueEl.val();

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
    },

    onPinEnter: function(pin) {},

    onSubmit: function(e)
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
    }

  });
});
