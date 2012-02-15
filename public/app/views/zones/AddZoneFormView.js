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
/**
 * @param {jQuery} $
 * @param {Underscore} _
 * @param {Backbone} Backbone
 * @param {function(new:Zone)} Zone
 * @param {Viewport} viewport
 * @param {function(new:PageLayout)} PageLayout
 * @param {function(new:PageLayout)} ControllerInfoFieldsView
 * @param {String} formTpl
 */
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
  /**
   * @class AddZoneFormView
   * @constructor
   * @extends Backbone.View
   * @param {Object} [options]
   */
  var AddZoneFormView = Backbone.View.extend({
    template: _.template(formTpl),
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
        text: 'Zapisz',
        className: 'blue save action',
        handler: this.submitForm
      }];
    },
    events: {
      'submit .form': 'submitForm'
    }
  });

  AddZoneFormView.prototype.initialize = function()
  {
    _.bindAll(this, 'submitForm');
  };

  AddZoneFormView.prototype.destroy = function()
  {
    this.remove();
  };

  AddZoneFormView.prototype.render = function()
  {
    var zone = this.model.toTemplateData();

    this.el.innerHTML = this.template({
      action: '/zones',
      zone: zone
    });

    new ControllerInfoFieldsView({
      el: this.$('ul.fields')[0],
      model: zone
    }).render();

    return this;
  };

  /**
   * @private
   * @return {Boolean}
   */
  AddZoneFormView.prototype.submitForm = function()
  {
    var formEl = this.$('form.zone');
    var data = formEl.toObject({skipEmpty: false}).zone;

    var zone = new Zone();

    zone.save(data, {
      success: function()
      {
        viewport.msg.show({
          type: 'success',
          time: 5000,
          text: 'Nowa strefa została dodana!'
        });

        Backbone.history.navigate('zones/' + zone.id, true);
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

  return AddZoneFormView;
});
