// Copyright (c) 2014, Łukasz Walukiewicz <lukasz@walukiewicz.eu>. Some Rights Reserved.
// Licensed under CC BY-NC-SA 4.0 <http://creativecommons.org/licenses/by-nc-sa/4.0/>.
// Part of the walkner-outdoor project <http://lukasz.walukiewicz.eu/p/walkner-outdoor>

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
/**
 * @param {jQuery} $
 * @param {Underscore} _
 * @param {Backbone} Backbone
 * @param {function(new:Controller)} Controller
 * @param {Viewport} viewport
 * @param {function(new:PageLayout)} PageLayout
 * @param {function(new:ConnectionInfoFieldsView)} ConnectionInfoFieldsView
 * @param {String} formTpl
 */
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
  /**
   * @class AddControllerFormView
   * @extends Backbone.View
   * @constructor
   * @param {Object} [options]
   */
  var AddControllerFormView = Backbone.View.extend({
    helpHash: 'controllers-add',
    template: _.template(formTpl),
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
        text: 'Zapisz',
        className: 'blue save action',
        handler: this.submitForm
      }];
    },
    events: {
      'submit .form': 'submitForm'
    }
  });

  AddControllerFormView.prototype.initialize = function()
  {
    _.bindAll(this, 'submitForm');
  };

  AddControllerFormView.prototype.destroy = function()
  {
    this.remove();
  };

  AddControllerFormView.prototype.render = function()
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
  AddControllerFormView.prototype.submitForm = function(e)
  {
    var formEl = this.$('form.controller');
    var data = formEl.toObject({skipEmpty: false}).controller;

    data.connectionInfo = data.connectionInfo[data.type];

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
          'controllers/' + controller.id, true
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
  };

  return AddControllerFormView;
});
