define(
[
  'Underscore',
  'Backbone',
  'jQuery'
],
function(_, Backbone, $)
{
  return Backbone.View.extend({

    initialize: function(options)
    {
      this.context = this.el.getContext('2d');
      this.x       = 0;

      if (options.resize)
      {
        this.onWindowResize = _.debounce(_.bind(this.onWindowResize, this), 50);

        $(window).on('resize', this.onWindowResize);
      }
    },

    destroy: function()
    {
      if (this.options.resize)
      {
        $(window).off('resize', this.onWindowResize);
      }

      this.context = null;
      this.x       = null;
    },

    clear: function()
    {
      this.x = 0;

      this.context.clearRect(0, 0, this.el.width, this.el.height);
    },

    resize: function()
    {
      var parentEl = $(this.el).parent();

      this.el.width  = this.options.width || parentEl.outerWidth(true);
      this.el.height = this.options.height || parentEl.outerHeight(true);

      return this;
    },

    render: function()
    {
      this.clear();
      this.resize();
      this.setStyles();

      _.each(this.model.steps, this.renderStep, this);

      return this;
    },

    renderStep: function(step, stepIndex)
    {
      var iteration     = step.iterations;
      var lastStepIndex = this.model.steps.length - 1;

      while (iteration--)
      {
        var last = iteration === 0 && stepIndex === lastStepIndex;

        this.renderStepIteration(step, last);
      }
    },

    renderStepIteration: function(step, last)
    {
      var padding = 3;

      var context = this.context;
      var width   = this.el.width;
      var height  = this.el.height;

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
    },

    getWidthForTime: function(time)
    {
      return this.el.width * time / this.model.totalTime;
    },

    setStyles: function()
    {
      var context = this.context;

      context.lineJoin    = 'miter';
      context.lineCap     = 'square';
      context.lineWidth   = 2;
      context.strokeStyle = '#B3B3B3';
    },

    onWindowResize: function()
    {
      this.render();
    }

  });
});
