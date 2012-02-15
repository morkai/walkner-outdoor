define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/models/Controllers',

  'text!app/templates/zones/controllerInfoFields.html'
],
/**
 * @param {jQuery} $
 * @param {Underscore} _
 * @param {Backbone} Backbone
 * @param {function(new:Controllers)} Controllers
 * @param {String} controllerInfoFieldsTpl
 */
function(
  $,
  _,
  Backbone,
  Controllers,
  controllerInfoFieldsTpl)
{
  /**
   * @class ControllerInfoFieldsView
   * @constructor
   * @extends Backbone.View
   * @param {Object} [options]
   */
  var ControllerInfoFieldsView = Backbone.View.extend({
    template: _.template(controllerInfoFieldsTpl),
    events: {
      'change select[name="zone.controller"]': 'onControllerChangeToggleInfo'
    }
  });

  ControllerInfoFieldsView.prototype.destroy = function()
  {
    this.remove();
  };

  ControllerInfoFieldsView.prototype.render = function()
  {
    $(this.el).append(this.template({zone: this.model}));

    var self = this;

    this.renderControllerOptions(function()
    {
      _.defer(function() { self.toggleControllerInfo(); });
    });

    return this;
  };

  /**
   * @private
   * @param {Function} done
   */
  ControllerInfoFieldsView.prototype.renderControllerOptions = function(done)
  {
    var self     = this;
    var selectEl = this.$('select[name="zone.controller"]');

    new Controllers().fetch({
      data: {
        fields: ['name', 'type']
      },
      success: function(controllers)
      {
        var selectedController = self.model.controller._id;

        controllers.each(function(controller)
        {
          $('<option></option>')
            .attr({
              value: controller.id,
              selected: controller.id == selectedController,
              'data-type': controller.get('type')
            })
            .text(controller.get('name'))
            .appendTo(selectEl);
        });

        _.defer(function()
        {
          selectEl.chosen({no_results_text: "Brak wyników dla"});
          done();
        });
      },
      error: function()
      {
        selectEl.chosen({no_results_text: "Brak wyników dla"});
        done();
      }
    });
  };

  /**
   * @private
   * @param {Boolean} focus
   */
  ControllerInfoFieldsView.prototype.toggleControllerInfo = function(focus)
  {
    var selectEl = this.$('select[name="zone.controller"]')[0];
    var optionEl = $(selectEl[selectEl.selectedIndex]);
    var controllerType = optionEl.attr('data-type');

    this.$('.controller-info:visible').hide();

    var newTypeFieldSet = this.$(
      '.controller-info[data-type="' + controllerType + '"]'
    ).show();

    if (focus)
    {
      _.defer(function()
      {
        newTypeFieldSet.find('input').first().click().focus();
      });
    }
  };

  /**
   * @private
   */
  ControllerInfoFieldsView.prototype.onControllerChangeToggleInfo = function()
  {
    this.toggleControllerInfo(true);
  };

  return ControllerInfoFieldsView;
});
