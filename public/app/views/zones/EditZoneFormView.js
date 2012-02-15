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
 * @param {function(new:ControllerInfoFieldsView)} ControllerInfoFieldsView
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
   * @class EditZoneFormView
   * @constructor
   * @extends Backbone.View
   * @param {Object} [options]
   */
  var EditZoneFormView = Backbone.View.extend({
    template: _.template(formTpl),
    layout: PageLayout,
    breadcrumbs: function()
    {
      var model = this.model;

      return [
        {href: '#zones', text: 'Strefy'},
        {href: '#zones/' + model.id, text: model.get('name')},
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

  EditZoneFormView.prototype.initialize = function()
  {
    _.bindAll(this, 'submitForm');
  };

  EditZoneFormView.prototype.destroy = function()
  {
    this.remove();
  };

  EditZoneFormView.prototype.render = function()
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
   */
  EditZoneFormView.prototype.submitForm = function()
  {
    var formEl = this.$('form.zone');

    var data = formEl.toObject({skipEmpty: false}).zone;
    data._id = this.model.id;

    var zone = new Zone(data);

    zone.save(data, {
      success: function()
      {
        viewport.msg.show({
          type: 'success',
          time: 5000,
          text: 'Strefa została zmodyfikowana pomyślnie!'
        });

        Backbone.history.navigate('zones/' + zone.id, true);
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
  };

  return EditZoneFormView;
});
