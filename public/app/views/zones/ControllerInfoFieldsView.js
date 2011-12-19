define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/models/Controllers',

  'text!app/templates/zones/controllerInfoFields.html'
],
function(
  $,
  _,
  Backbone,
  Controllers,
  controllerInfoFieldsTpl)
{
  var renderControllerInfoFields = _.template(controllerInfoFieldsTpl);

  return Backbone.View.extend({

    events: {
      'change select[name="zone.controller"]': 'onControllerChangeToggleControllerInfo'
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
      $(this.el).append(renderControllerInfoFields({zone: this.model}));

      var self = this;

      this.renderControllerOptions(function()
      {
        _.defer(function() { self.toggleControllerInfo(); });
      });

      return this;
    },

    renderControllerOptions: function(done)
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
                value      : controller.get('_id'),
                selected   : controller.get('_id') == selectedController,
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
    },

    toggleControllerInfo: function(focus)
    {
      var selectEl       = this.$('select[name="zone.controller"]')[0];
      var optionEl       = $(selectEl[selectEl.selectedIndex]);
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
    },

    onControllerChangeToggleControllerInfo: function()
    {
      this.toggleControllerInfo(true);
    }

  });
});
