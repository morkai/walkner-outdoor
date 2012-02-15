define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/models/controllerTypes',

  'text!app/templates/controllers/connectionInfoFields.html'
],
/**
 * @param {jQuery} $
 * @param {Underscore} _
 * @param {Backbone} Backbone
 * @param {Object} controllerTypes
 * @param {String} connectionInfoFieldsTpl
 */
function(
  $,
  _,
  Backbone,
  controllerTypes,
  connectionInfoFieldsTpl)
{
  /**
   * @class ConnectionInfoFieldsView
   * @extends BackboneView
   * @constructor
   * @param {Object} [options]
   */
  var ConnectionInfoFieldsView = Backbone.View.extend({
    template: _.template(connectionInfoFieldsTpl),
    events: {
      'change select[name="controller.type"]': 'onTypeChangeToggleConnectionInfo'
    }
  });

  ConnectionInfoFieldsView.prototype.destroy = function()
  {
    this.remove();
  };

  ConnectionInfoFieldsView.prototype.render = function()
  {
    $(this.el).append(this.template({controller: this.model}));

    this.renderTypeOptions();

    var self = this;

    _.defer(function() { self.toggleConnectionInfo(); });

    return this;
  };

  /**
   * @private
   */
  ConnectionInfoFieldsView.prototype.renderTypeOptions = function()
  {
    var selectedType = this.model.type;
    var selectEl = this.$('select[name="controller.type"]');

    _.each(controllerTypes, function(text, value)
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
  };

  /**
   * @private
   */
  ConnectionInfoFieldsView.prototype.toggleConnectionInfo = function(focus)
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
  };

  /**
   * @private
   * @param {Object} e
   */
  ConnectionInfoFieldsView.prototype.onTypeChangeToggleConnectionInfo =
    function(e)
  {
    this.toggleConnectionInfo(true);
  };

  return ConnectionInfoFieldsView;
});
