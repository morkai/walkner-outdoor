define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/views/viewport',
  'app/views/PageLayout',
  'app/views/controllers/ConnectionInfoFieldsView',

  'text!app/templates/controllers/form.html'
],
function(
  $,
  _,
  Backbone,
  viewport,
  PageLayout,
  ConnectionInfoFieldsView,
  formTpl)
{
  var renderForm = _.template(formTpl);

  return Backbone.View.extend({

    layout: PageLayout,

    breadcrumbs: function()
    {
      var model = this.model;

      return [
        {href: '#controllers', text: 'Sterowniki'},
        {href: '#controllers/' + model.get('_id'), text: model.get('name')},
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
      var controller = this.model.toTemplateData();

      this.el.innerHTML = renderForm({
        action    : '/controllers',
        controller: controller
      });

      new ConnectionInfoFieldsView({
        el   : this.$('ul.fields')[0],
        model: controller
      }).render();

      return this;
    },

    submitForm: function(e)
    {
      var formEl     = this.$('form.controller');
      var data       = formEl.toObject({skipEmpty: false}).controller;
      var controller = this.model;

      controller.save(data, {
        success: function()
        {
          viewport.msg.show({
            type: 'success',
            time: 5000,
            text: 'Sterownik został zmodyfikowany pomyślnie!'
          });

          Backbone.history.navigate(
            'controllers/' + controller.get('_id'), true
          );
        },
        error: function(controller, xhr)
        {
          viewport.msg.show({
            type: 'error',
            time: 5000,
            text: xhr.responseText || 'Nie udało się zmodyfikować sterownika :('
          });
        }
      });

      return false;
    }

  });
});
