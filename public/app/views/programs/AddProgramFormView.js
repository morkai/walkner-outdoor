define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/models/Program',
  'app/views/viewport',
  'app/views/PageLayout',
  'app/views/programs/ProgramStepsTableView',

  'text!app/templates/programs/form.html'
],
function(
  $,
  _,
  Backbone,
  Program,
  viewport,
  PageLayout,
  ProgramStepsTableView,
  formTpl)
{
  var renderForm = _.template(formTpl);

  return Backbone.View.extend({

    layout: PageLayout,

    breadcrumbs: function()
    {
      return [
        {href: '#programs', text: 'Programy'},
        'Nowy program'
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
      var program = this.model.toTemplateData({minSteps: 3});

      this.el.innerHTML = renderForm({
        action: '/programs',
        program: program
      });

      new ProgramStepsTableView({steps: program.steps}).replace(this.el);

      return this;
    },

    submitForm: function(e)
    {
      var data = this.$('form.program').toObject({skipEmpty: false}).program;

      if (data.name.trim() === '')
      {
        viewport.msg.show({
          type: 'error',
          time: 2500,
          text: 'Nazwa programu jest wymagana.'
        });

        return false;
      }

      var program = new Program();

      program.save(data, {
        success: function()
        {
          viewport.msg.show({
            type: 'success',
            time: 5000,
            text: 'Nowy program został dodany!'
          });

          Backbone.history.navigate('programs/' + program.get('_id'), true);
        },
        error: function()
        {
          viewport.msg.show({
            type: 'error',
            time: 5000,
            text: 'Nie udało się zapisać nowego programu :('
          });
        }
      });

      return false;
    }

  });
});
