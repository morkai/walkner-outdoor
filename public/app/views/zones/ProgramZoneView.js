define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/models/Programs',
  'app/views/viewport',
  'app/views/PageLayout',

  'text!app/templates/zones/programForm.html'
],
function(
  $,
  _,
  Backbone,
  Programs,
  viewport,
  PageLayout,
  programFormTpl)
{
  var renderProgramForm = _.template(programFormTpl);

  return Backbone.View.extend({

    layout: PageLayout,

    breadcrumbs: function()
    {
      var model = this.model;

      return [
        {href: '#zones', text: 'Strefy'},
        {href: '#zones/' + model.get('_id'), text: model.get('name')},
        'Programowanie'
      ];
    },

    actions: function()
    {
      return [{
        text     : 'Programuj',
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
      var zone = this.model.toTemplateData();

      this.el.innerHTML = renderProgramForm({
        zone: zone
      });

      this.renderProgramOptions();

      return this;
    },

    renderProgramOptions: function()
    {
      var selectEl       = this.$('select[name="zone.program"]');
      var currentProgram = this.model.get('program');

      if (currentProgram)
      {
        currentProgram = currentProgram.get('_id');
      }

      new Programs().fetch({
        fields: ['name'],
        success: function(programs)
        {
          programs.each(function(program)
          {
            $('<option></option>')
              .attr({
                value: program.get('_id'),
                selected: program.get('_id') === currentProgram
              })
              .text(program.get('name'))
              .appendTo(selectEl);
          });

          selectEl.chosen({
            no_results_text      : 'Brak wyników dla',
            allow_single_deselect: true
          });
        },
        error: function()
        {
          selectEl.chosen();
        }
      });
    },

    submitForm: function(e)
    {
      var formEl = this.$('form.program-zone');
      var data   = formEl.toObject({skipEmpty: false}).zone;
      var zone   = this.model;

      zone.save(data, {
        success: function()
        {
          viewport.msg.show({
            type: 'success',
            time: 5000,
            text: 'Strefa została zaprogramowana pomyślnie!'
          });

          Backbone.history.navigate(
            'zones/' + zone.get('_id'), true
          );
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
    }

  });
});
