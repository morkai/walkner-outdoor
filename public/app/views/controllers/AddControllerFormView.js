define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/models/Controller',
  'app/views/viewport',
  'app/views/PageLayout',
  'app/views/controllers/ConnectionInfoFieldsView',

  'text!app/templates/controllers/form.html'
],
function(
  $,
  _,
  Backbone,
  Controller,
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
      return [
        {href: '#controllers', text: 'Sterowniki'},
        'Nowy sterownik'
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
      var formEl = this.$('form.controller');
      var data   = formEl.toObject({skipEmpty: false}).controller;

      var controller = new Controller();

      controller.save(data, {
        success: function()
        {
          viewport.msg.show({
            type: 'success',
            time: 5000,
            text: 'Nowy sterownik został dodany!'
          });

          Backbone.history.navigate(
            'controllers/' + controller.get('_id'), true
          );
        },
        error: function()
        {
          viewport.msg.show({
            type: 'error',
            time: 5000,
            text: 'Nie udało się zapisać nowego sterownika :('
          });
        }
      });

      return false;
    }

  });
});
