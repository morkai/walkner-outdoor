define(
[
  'Underscore',
  'Backbone',
  'jQuery'
],
/**
 * @param {jQuery} $
 * @param {Underscore} _
 * @param {Backbone} Backbone
 */
function(_, Backbone, $)
{
  /**
   * @class ProgramStepsPlotView
   * @constructor
   * @extends Backbone.View
   * @param {Object} [options]
   */
  var ProgramStepsPlotView = Backbone.View.extend({

  });

  ProgramStepsPlotView.prototype.initialize = function(options)
  {
    this.context = this.el.getContext('2d');
    this.x = 0;

    if (options.resize)
    {
      this.onWindowResize = _.debounce(_.bind(this.onWindowResize, this), 50);

      $(window).on('resize', this.onWindowResize);
    }
  };

  ProgramStepsPlotView.prototype.destroy = function()
  {
    if (this.options.resize)
    {
      $(window).off('resize', this.onWindowResize);
    }

    this.context = null;
    this.x = null;
  };

  ProgramStepsPlotView.prototype.clear = function()
  {
    this.x = 0;

    this.context.clearRect(0, 0, this.el.width, this.el.height);
  };

  ProgramStepsPlotView.prototype.resize = function()
  {
    var parentEl = $(this.el).parent();

    this.el.width = this.options.width || parentEl.outerWidth(true);
    this.el.height = this.options.height || parentEl.outerHeight(true);

    return this;
  };

  ProgramStepsPlotView.prototype.render = function()
  {
    this.clear();
    this.resize();
    this.setStyles();

    _.each(this.model.steps, this.renderStep, this);

    return this;
  };

  /**
   * @private
   * @param {Object} step
   * @param {Number} stepIndex
   */
  ProgramStepsPlotView.prototype.renderStep = function(step, stepIndex)
  {
    var iteration = step.iterations;
    var lastStepIndex = this.model.steps.length - 1;

    while (iteration--)
    {
      var last = iteration === 0 && stepIndex === lastStepIndex;

      this.renderStepIteration(step, last);
    }
  };

  /**
   * @private
   * @param {Object} step
   * @param {Boolean} last
   */
  ProgramStepsPlotView.prototype.renderStepIteration = function(step, last)
  {
    var padding = 3;
    var context = this.context;
    var width = this.el.width;
    var height = this.el.height;

    context.beginPath();
    context.moveTo(this.x, padding);

    this.x += this.getWidthForTime(step.timeOn);

    context.lineTo(this.x, padding);
    context.lineTo(this.x, height - padding);

    this.x += this.getWidthForTime(step.timeOff);

    if (this.x >= width - 1)
    {
      this.x = width - 1;
    }

    context.lineTo(this.x, height - padding);

    if (!last)
    {
      context.lineTo(this.x, padding);
    }

    context.stroke();
  };

  /**
   * @private
   * @param {Number} time
   * @return {Number}
   */
  ProgramStepsPlotView.prototype.getWidthForTime = function(time)
  {
    return this.el.width * time / this.model.totalTime;
  };

  /**
   * @private
   */
  ProgramStepsPlotView.prototype.setStyles = function()
  {
    var context = this.context;

    context.lineJoin = 'miter';
    context.lineCap = 'square';
    context.lineWidth = 2;
    context.strokeStyle = '#B3B3B3';
  };

  /**
   * @private
   */
  ProgramStepsPlotView.prototype.onWindowResize = function()
  {
    this.render();
  };

  return ProgramStepsPlotView;
});
