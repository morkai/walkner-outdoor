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
/**
 * @param {jQuery} $
 * @param {Underscore} _
 * @param {Backbone} Backbone
 * @param {function(new:Program)} Program
 * @param {Viewport} viewport
 * @param {function(new:PageLayout)} PageLayout
 * @param {function(new:ProgramStepsTableView)} ProgramStepsTableView
 * @param {String} formTpl
 */
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
  /**
   * @class EditProgramFormView
   * @constructor
   * @extends Backbone.View
   * @param {Object} [options]
   */
  var EditProgramFormView = Backbone.View.extend({
    template: _.template(formTpl),
    layout: PageLayout,
    breadcrumbs: function()
    {
      var model = this.model;

      return [
        {href: '#programs', text: 'Programy'},
        {href: '#programs/' + model.id, text: model.get('name')},
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

  EditProgramFormView.prototype.initialize = function()
  {
    _.bindAll(this, 'submitForm');
  };

  EditProgramFormView.prototype.destroy = function()
  {
    this.remove();
  };

  EditProgramFormView.prototype.render = function()
  {
    var program = this.model.toTemplateData({minSteps: 3});

    this.el.innerHTML = this.template({
      action: '/programs/' + program._id,
      program: program
    });

    if (program.infinite)
    {
      this.$('input[name="program.infinite"]').attr('checked', true);
    }

    new ProgramStepsTableView({steps: program.steps}).replace(this.el);

    return this;
  };

  /**
   * @private
   */
  EditProgramFormView.prototype.submitForm = function()
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

    var program = this.model;

    program.save(data, {
      success: function()
      {
        viewport.msg.show({
          type: 'success',
          time: 5000,
          text: 'Program został zmodyfikowany pomyślnie!'
        });

        Backbone.history.navigate('programs/' + program.id, true);
      },
      error: function()
      {
        viewport.msg.show({
          type: 'error',
          time: 5000,
          text: 'Nie udało się zmodyfikować programu :('
        });
      }
    });

    return false;
  };

  return EditProgramFormView;
});
