define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/models/Program',
  'app/views/PageLayout',

  'text!app/templates/programs/stepsTable.html'
],
function($, _, Backbone, Program, PageLayout, stepsTableTpl)
{
  var renderStepsTable = _.template(stepsTableTpl);

  return Backbone.View.extend({

    events: {
      'click th': 'selectLastFieldInColumn',
      'click .remove-program-step': 'removeProgramStep',
      'click .add-program-step': 'addProgramStep'
    },

    destroy: function()
    {
      this.remove();
    },

    render: function()
    {
      this.el.innerHTML = renderStepsTable({
        mutable: !this.options.readOnly,
        steps: this.options.steps
      });

      return this;
    },

    replace: function(el)
    {
      $(el).find('.program-steps').replaceWith(this.render().el);

      return this;
    },

    recountSteps: function()
    {
      this.$('.program-step-number:visible').each(function(i)
      {
        this.innerText = (i + 1) + '.';
      });
    },

    selectLastFieldInColumn: function(e)
    {
      var clickedHeader = $(e.target).index();
      var lastStepCells = this.$('tbody tr').last().children();
      var correspondingCell = lastStepCells.eq(clickedHeader);

      correspondingCell.find('input').focus();
    },

    removeProgramStep: function(e)
    {
      var self = this;
      var clickedButton = $(e.target);
      var desiredRow = clickedButton.closest('tr');

      desiredRow.fadeOut(function()
      {
        desiredRow.remove();
        self.recountSteps();
      });

      var neighbor = desiredRow.is(':last-child')
        ? desiredRow.prev()
        : desiredRow.next();

      if (neighbor.is(':visible'))
      {
        neighbor.find('.remove-program-step').focus();
      }
      else
      {
        this.$('.add-program-step').focus();
      }
    },

    addProgramStep: function()
    {
      var steps = this.$('.program-steps tbody');
      var step = this.$('.program-step-template').clone();

      step.hide().removeClass('program-step-template');
      step.appendTo(steps).fadeIn();

      this.recountSteps();

      step.find('input').first().focus();
    }

  });
});