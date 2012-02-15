define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/views/PageLayout',
  'app/views/viewport',

  'text!app/templates/history/purgeForm.html'
],
/**
 * @param {jQuery} $
 * @param {Underscore} _
 * @param {Backbone} Backbone
 * @param {Viewport} viewport
 * @param {function(new:PageLayout)} PageLayout
 * @param {String} purgeFormTpl
 */
function(
  $,
  _,
  Backbone,
  viewport,
  PageLayout,
  purgeFormTpl)
{
  /**
   * @class PurgeHistoryFormView
   * @constructor
   * @extends Backbone.View
   * @param {Object} [options]
   */
  var PurgeHistoryFormView = Backbone.View.extend({
    template: _.template(purgeFormTpl),
    layout: PageLayout,
    breadcrumbs: function()
    {
      return [
        {href: '#history', text: 'Historia'},
        'Czyszczenie historii'
      ];
    },
    events: {
      'submit form.purgeHistory': 'onFormSubmit',
      'click .yes.action': 'onFormSubmit'
    }
  });

  PurgeHistoryFormView.prototype.destroy = function()
  {
    this.remove();
  };

  PurgeHistoryFormView.prototype.render = function()
  {
    this.el.innerHTML = this.template();

    return this;
  };

  /**
   * @private
   */
  PurgeHistoryFormView.prototype.onFormSubmit = function()
  {
    var age = parseInt(this.$('input[name="age"]').val());

    if (isNaN(age) || age === 0)
    {
      viewport.msg.show({
        type: 'error',
        time: 3000,
        text: 'Liczba dni musi być liczbą większą od 0 :('
      });
    }
    else
    {
      $.ajax({
        type: 'DELETE',
        url: '/history',
        data: {age: age},
        success: function()
        {
          viewport.msg.show({
            type: 'success',
            time: 2000,
            text: 'Historia została wyczyszczona pomyślnie!'
          });
        },
        error: function(xhr)
        {
          viewport.msg.show({
            type: 'error',
            time: 2000,
            text: 'Nie udało się wyczyścić historii :('
          });
        },
        complete: function()
        {
          viewport.closeDialog();
        }
      })
    }

    return false;
  };

  return PurgeHistoryFormView;
});
