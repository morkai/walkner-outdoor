// Copyright (c) 2014, Łukasz Walukiewicz <lukasz@walukiewicz.eu>. Some Rights Reserved.
// Licensed under CC BY-NC-SA 4.0 <http://creativecommons.org/licenses/by-nc-sa/4.0/>.
// Part of the walkner-outdoor project <http://lukasz.walukiewicz.eu/p/walkner-outdoor>

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
/**
 * @param {jQuery} $
 * @param {Underscore} _
 * @param {Backbone} Backbone
 * @param {Viewport} viewport
 * @param {function(new:PageLayout)} PageLayout
 * @param {function(new:ConnectionInfoFieldsView)} ConnectionInfoFieldsView
 * @param {String} formTpl
 */
function(
  $,
  _,
  Backbone,
  viewport,
  PageLayout,
  ConnectionInfoFieldsView,
  formTpl)
{
  /**
   * @class EditControllerFormView
   * @extends Backbone.View
   * @constructor
   * @param {Object} [options]
   */
  var EditControllerFormView = Backbone.View.extend({
    helpHash: 'controllers-edit',
    template: _.template(formTpl),
    layout: PageLayout,
    breadcrumbs: function()
    {
      var model = this.model;

      return [
        {href: '#controllers', text: 'Sterowniki'},
        {href: '#controllers/' + model.id, text: model.get('name')},
        {text: 'Edycja'}
      ];
    },
    actions: function()
    {
      return [{
        text: 'Zapisz',
        className: 'blue save action',
        handler: this.submitForm
      }];
    },
    events: {
      'submit .form': 'submitForm'
    }
  });

  EditControllerFormView.prototype.initialize = function()
  {
    _.bindAll(this, 'submitForm');
  };

  EditControllerFormView.prototype.destroy = function()
  {
    this.remove();
  };

  EditControllerFormView.prototype.render = function()
  {
    var controller = this.model.toTemplateData();

    this.el.innerHTML = this.template({
      action: '/controllers',
      controller: controller
    });

    new ConnectionInfoFieldsView({
      el: this.$('ul.fields')[0],
      model: controller
    }).render();

    return this;
  };

  /**
   * @private
   * @param {Object} e
   * @return {Boolean}
   */
  EditControllerFormView.prototype.submitForm = function(e)
  {
    var formEl = this.$('form.controller');
    var data = formEl.toObject({skipEmpty: false}).controller;
    var controller = this.model;

    data.connectionInfo = data.connectionInfo[data.type];

    controller.save(data, {
      success: function()
      {
        viewport.msg.show({
          type: 'success',
          time: 5000,
          text: 'Sterownik został zmodyfikowany pomyślnie!'
        });

        Backbone.history.navigate(
          'controllers/' + controller.id, true
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
  };

  return EditControllerFormView;
});
