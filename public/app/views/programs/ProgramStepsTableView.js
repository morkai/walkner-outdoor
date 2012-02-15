define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/models/Program',
  'app/views/PageLayout',

  'text!app/templates/programs/stepsTable.html'
],
/**
 * @param {jQuery} $
 * @param {Underscore} _
 * @param {Backbone} Backbone
 * @param {function(new:Program)} Program
 * @param {function(new:PageLayout)} PageLayout
 * @param {String} stepsTableTpl
 */
function($, _, Backbone, Program, PageLayout, stepsTableTpl)
{
  /**
   * @class ProgramStepsTableView
   * @constructor
   * @extends Backbone.View
   * @param {Object} [options]
   */
  var ProgramStepsTableView = Backbone.View.extend({
    template: _.template(stepsTableTpl),
    events: {
      'click th': 'selectLastFieldInColumn',
      'click .remove-program-step': 'removeProgramStep',
      'click .add-program-step': 'addProgramStep',
      'blur .textline': 'changeTimeToSeconds'
    }
  });

  ProgramStepsTableView.prototype.initialize = function()
  {
    this.nextStepIndex = 0;
  };

  ProgramStepsTableView.prototype.destroy = function()
  {
    this.remove();
  };

  ProgramStepsTableView.prototype.render = function()
  {
    this.nextStepIndex = this.options.steps.length;

    this.el.innerHTML = this.template({
      mutable: !this.options.readOnly,
      steps: this.options.steps
    });

    return this;
  };

  /**
   * @private
   * @param {Element} el
   */
  ProgramStepsTableView.prototype.replace = function(el)
  {
    $(el).find('.program-steps').replaceWith(this.render().el);

    return this;
  };

  /**
   * @private
   */
  ProgramStepsTableView.prototype.recountSteps = function()
  {
    this.$('.program-step-number:visible').each(function(i)
    {
      this.innerText = (i + 1) + '.';
    });
  };

  /**
   * @private
   * @param {Object} e
   */
  ProgramStepsTableView.prototype.selectLastFieldInColumn = function(e)
  {
    var clickedHeader = $(e.target).index();
    var lastStepCells = this.$('tbody tr').last().children();
    var correspondingCell = lastStepCells.eq(clickedHeader);

    correspondingCell.find('input').focus();
  };

  /**
   * @private
   * @param {Object} e
   */
  ProgramStepsTableView.prototype.removeProgramStep = function(e)
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
  };

  /**
   * @private
   */
  ProgramStepsTableView.prototype.addProgramStep = function()
  {
    var self = this;
    var steps = this.$('.program-steps tbody');
    var step = this.$('.program-step-template').clone();

    step.hide().removeClass('program-step-template');
    step.find('input[type="text"]').each(function()
    {
      this.name = this.name.replace(
        'steps[]', 'steps[' + self.nextStepIndex + ']'
      );
    });
    step.appendTo(steps).fadeIn();

    this.recountSteps();

    step.find('input').first().focus();

    this.nextStepIndex += 1;
  };

  /**
   * @private
   * @param {Object} e
   */
  ProgramStepsTableView.prototype.changeTimeToSeconds = function(e)
  {
    var multipliers = {
      g: 3600,
      h: 3600,
      m: 60,
      s: 1
    };

    var input = e.target;
    var time = input.value.trim();
    var seconds = time;

    if (/^[0-9]+\.?[0-9]*$/.test(time) === false)
    {
      var re = /([0-9\.]+) *(h|m|s)[a-z]*/ig;
      var match;

      seconds = 0;

      while (match = re.exec(time))
      {
        seconds += match[1] * multipliers[match[2].toLowerCase()];
      }
    }

    input.value = seconds;
  };

  return ProgramStepsTableView;
});
