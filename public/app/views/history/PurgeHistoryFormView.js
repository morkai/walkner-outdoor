define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/views/PageLayout',
  'app/views/viewport',

  'text!app/templates/history/purgeForm.html'
],
function(
  $,
  _,
  Backbone,
  PageLayout,
  viewport,
  purgeFormTpl)
{
  var renderPurgeForm = _.template(purgeFormTpl);

  return Backbone.View.extend({

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
      'click .yes.action'       : 'onFormSubmit'
    },

    initialize: function()
    {

    },

    destroy: function()
    {
      this.remove();
    },

    render: function()
    {
      this.el.innerHTML = renderPurgeForm();

      return this;
    },

    onFormSubmit: function()
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
    }
  });
});
