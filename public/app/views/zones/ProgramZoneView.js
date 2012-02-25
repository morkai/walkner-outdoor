define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/models/Programs',
  'app/models/Zone',
  'app/views/viewport',
  'app/views/PageLayout',

  'text!app/templates/zones/programForm.html'
],
/**
 * @param {jQuery} $
 * @param {Underscore} _
 * @param {Backbone} Backbone
 * @param {function(new:Programs)} Programs
 * @param {function(new:Zone)} Zone
 * @param {Viewport} viewport
 * @param {function(new:PageLayout)} PageLayout
 * @param {String} programFormTpl
 */
function(
  $,
  _,
  Backbone,
  Programs,
  Zone,
  viewport,
  PageLayout,
  programFormTpl)
{
  /**
   * @class ProgramZoneView
   * @constructor
   * @extends Backbone.View
   * @param {Object} [options]
   */
  var ProgramZoneView = Backbone.View.extend({
    helpHash: 'zones-program',
    template: _.template(programFormTpl),
    layout: PageLayout,
    breadcrumbs: function()
    {
      var model = this.model;

      return [
        {href: '#zones', text: 'Strefy'},
        {href: '#zones/' + model.id, text: model.get('name')},
        'Programowanie'
      ];
    },
    actions: function()
    {
      return [{
        text: 'Programuj',
        className: 'blue save action',
        handler: this.submitForm
      }];
    },
    events: {
      'submit .form': 'submitForm'
    }
  });

  ProgramZoneView.prototype.initialize = function()
  {
    _.bindAll(this, 'submitForm');
  };

  ProgramZoneView.prototype.destroy = function()
  {
    this.remove();
  };

  ProgramZoneView.prototype.render = function()
  {
    var zone = this.model.toTemplateData();

    this.el.innerHTML = this.template({
      zone: zone
    });

    this.renderProgramOptions();

    return this;
  };

  /**
   * @private
   */
  ProgramZoneView.prototype.renderProgramOptions = function()
  {
    var selectEl  = this.$('select[name="zone.program"]');
    var currentProgram = this.model.get('program');

    if (currentProgram)
    {
      currentProgram = currentProgram.id;
    }

    new Programs().fetch({
      fields: ['name'],
      success: function(programs)
      {
        programs.each(function(program)
        {
          $('<option></option>')
            .attr({
              value: program.id,
              selected: program.id === currentProgram
            })
            .text(program.get('name'))
            .appendTo(selectEl);
        });

        selectEl.chosen({
          no_results_text: 'Brak wyników dla',
          allow_single_deselect: true
        });
      },
      error: function()
      {
        selectEl.chosen();
      }
    });
  };

  /**
   * @private
   */
  ProgramZoneView.prototype.submitForm = function()
  {
    var formEl = this.$('form.program-zone');
    var model = this.model;
    var data = formEl.toObject({skipEmpty: false}).zone;

    $.ajax({
      type: 'PUT',
      url: '/zones/' + model.id,
      data: data,
      success: function()
      {
        viewport.msg.show({
          type: 'success',
          time: 5000,
          text: 'Strefa została zaprogramowana pomyślnie!'
        });

        Backbone.history.navigate('zones/' + model.id, true);
      },
      error: function()
      {
        viewport.msg.show({
          type: 'error',
          time: 5000,
          text: 'Nie udało się zaprogramować wybranej strefy :('
        });
      }
    });

    return false;
  };

  return ProgramZoneView;
});
