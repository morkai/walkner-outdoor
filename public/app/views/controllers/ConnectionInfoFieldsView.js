define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'text!app/templates/controllers/connectionInfoFields.html'
],
function(
  $,
  _,
  Backbone,
  connectionInfoFieldsTpl)
{
  var renderConnectionInfoFields = _.template(connectionInfoFieldsTpl);

  return Backbone.View.extend({

    events: {
      'change select[name="controller.type"]': 'onTypeChangeToggleConnectionInfo'
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
      $(this.el).append(renderConnectionInfoFields({controller: this.model}));

      this.renderTypeOptions();

      var self = this;

      _.defer(function() { self.toggleConnectionInfo(); });

      return this;
    },

    renderTypeOptions: function()
    {
      var selectedType = this.model.type;
      var selectEl     = this.$('select[name="controller.type"]');

      _.each({'modbus-tcp': 'MODBUS TCP/IP'}, function(text, value)
      {
        $('<option></option>')
          .attr({value: value, selected: value === selectedType})
          .text(text)
          .appendTo(selectEl);
      });

      _.defer(function()
      {
        selectEl.chosen({no_results_text: "Brak wyników dla"});
      });
    },

    toggleConnectionInfo: function(focus)
    {
      var connectionType = this.$('select[name="controller.type"]').val();

      this.$('.controller-type:visible').hide();

      var newTypeFieldSet = this.$(
        '.controller-type[data-type="' + connectionType + '"]'
      ).show();

      if (focus)
      {
        _.defer(function()
        {
          newTypeFieldSet.find('input').first().click().focus();
        });
      }
    },

    onTypeChangeToggleConnectionInfo: function(e)
    {
      this.toggleConnectionInfo(true);
    }

  });
});
