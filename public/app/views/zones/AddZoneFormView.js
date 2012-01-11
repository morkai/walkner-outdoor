define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/models/Zone',
  'app/views/viewport',
  'app/views/PageLayout',
  'app/views/zones/ControllerInfoFieldsView',

  'text!app/templates/zones/form.html'
],
function(
  $,
  _,
  Backbone,
  Zone,
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
      return [
        {href: '#zones', text: 'Strefy'},
        'Nowa strefa'
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

      var zone = new Zone();

      zone.save(data, {
        success: function()
        {
          viewport.msg.show({
            type: 'success',
            time: 5000,
            text: 'Nowa strefa została dodana!'
          });

          Backbone.history.navigate(
            'zones/' + zone.get('_id'), true
          );
        },
        error: function(_, xhr)
        {
          viewport.msg.show({
            type: 'error',
            time: 5000,
            text: xhr.responseText || 'Nie udało się zapisać nowej strefy :('
          });
        }
      });

      return false;
    }

  });
});
