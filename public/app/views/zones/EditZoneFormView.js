define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/views/viewport',
  'app/views/PageLayout',
  'app/views/zones/ControllerInfoFieldsView',

  'text!app/templates/zones/form.html'
],
function(
  $,
  _,
  Backbone,
  viewport,
  PageLayout,
  ControllerInfoFieldsView,
  formTpl)
{
  var renderForm = _.template(formTpl);

  return Backbone.View.extend({

    layout: PageLayout,

    breadcrumbs: function()
    {
      var model = this.model;

      return [
        {href: '#zones', text: 'Strefy'},
        {href: '#zones/' + model.get('_id'), text: model.get('name')},
        {text: 'Edycja'}
      ];
    },

    actions: function()
    {
      return [{
        text     : 'Zapisz',
        className: 'blue save action',
        handler  : this.submitForm
      }];
    },

    events: {
      'submit .form' : 'submitForm'
    },

    initialize: function()
    {
      _.bindAll(this, 'submitForm');
    },

    destroy: function()
    {
      this.remove();
    },

    render: function()
    {
      var zone = this.model.toTemplateData();

      this.el.innerHTML = renderForm({
        action: '/zones',
        zone  : zone
      });

      new ControllerInfoFieldsView({
        el   : this.$('ul.fields')[0],
        model: zone
      }).render();

      return this;
    },

    submitForm: function(e)
    {
      var formEl = this.$('form.zone');
      var data   = formEl.toObject({skipEmpty: false}).zone;
      var zone   = this.model;

      zone.save(data, {
        success: function()
        {
          viewport.msg.show({
            type: 'success',
            time: 5000,
            text: 'Strefa została zmodyfikowana pomyślnie!'
          });

          Backbone.history.navigate(
            'zones/' + zone.get('_id'), true
          );
        },
        error: function(zone, xhr)
        {
          viewport.msg.show({
            type: 'error',
            time: 5000,
            text: xhr.responseText || 'Nie udało się zmodyfikować strefy :('
          });
        }
      });

      return false;
    }

  });
});
