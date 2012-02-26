define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/views/programs/ProgramStepsPlotView',
  'app/views/programs/ProgramStepsTableView',

  'text!app/templates/programs/details.html'
],
/**
 * @param {jQuery} $
 * @param {Underscore} _
 * @param {Backbone} Backbone
 * @param {function(new:ProgramStepsPlotView)} ProgramStepsPlotView
 * @param {function(new:ProgramStepsTableView)} ProgramStepsTableView
 * @param {String} detailsTpl
 */
function(
  $,
  _,
  Backbone,
  ProgramStepsPlotView,
  ProgramStepsTableView,
  detailsTpl)
{
  /**
   * @class ProgramDetailsView
   * @constructor
   * @extends Backbone.View
   * @param {Object} [options]
   */
  var ProgramDetailsView = Backbone.View.extend({
    template: _.template(detailsTpl)
  });

  ProgramDetailsView.prototype.initialize = function()
  {
    this.tableView = null;
    this.plotView = null;
  };

  ProgramDetailsView.prototype.destroy = function()
  {
    _.destruct(this, 'tableView', 'plotView');

    this.remove();
  };

  ProgramDetailsView.prototype.render = function()
  {
    var program = this.model.toTemplateData();

    this.el.innerHTML = this.template({program: program});

    if (program.steps.length)
    {
      this.tableView = new ProgramStepsTableView({
        readOnly: true,
        steps: program.steps
      }).replace(this.el);

      this.plotView = new ProgramStepsPlotView({
        el: this.$('.program-plot')[0],
        resize: true,
        height: 50,
        model: {
          totalTime: this.model.get('totalTime'),
          steps: this.model.get('steps')
        }
      });

      var self = this;

      setTimeout(function() { self.plotView.render(); }, 1);
    }

    return this;
  };

  return ProgramDetailsView;
});
