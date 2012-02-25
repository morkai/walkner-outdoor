define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/models/Program',
  'app/views/viewport',
  'app/views/PageLayout',
  'app/views/programs/ProgramStepsPlotView',
  'app/views/programs/ProgramStepsTableView',

  'text!app/templates/history/entry.html'
],
/**
 * @param {jQuery} $
 * @param {Underscore} _
 * @param {Backbone} Backbone
 * @param {function(new:Program)} Program
 * @param {Viewport} viewport
 * @param {function(new:PageLayout)} PageLayout
 * @param {function(new:ProgramStepsPlotView)} ProgramStepsPlotView
 * @param {function(new:ProgramStepsTableView)} ProgramStepsTableView
 * @param {String} entryTpl
 */
function(
  $,
  _,
  Backbone,
  Program,
  viewport,
  PageLayout,
  ProgramStepsPlotView,
  ProgramStepsTableView,
  entryTpl)
{
  /**
   * @class HistoryEntryView
   * @constructor
   * @extends Backbone.View
   * @param {Object} [options]
   */
  var HistoryEntryView = Backbone.View.extend({
    helpHash: 'history-view',
    template: _.template(entryTpl),
    layout: PageLayout,
    breadcrumbs: function()
    {
      return [
        {href: '#history', text: 'Historia'},
        'Wpis'
      ];
    }
  });

  HistoryEntryView.prototype.initialize = function()
  {
    this.tableView = null;
    this.plotView = null;
  };

  HistoryEntryView.prototype.destroy = function()
  {
    _.destruct(this, 'tableView', 'plotView');

    this.remove();
  };

  HistoryEntryView.prototype.render = function()
  {
    var entry = this.model.toTemplateData();

    this.el.innerHTML = this.template({entry: entry});

    if (entry.programSteps.length)
    {
      this.tableView = new ProgramStepsTableView({
        readOnly: true,
        steps: entry.programSteps
      }).replace(this.el);

      this.plotView = new ProgramStepsPlotView({
        el: this.$('.program-plot')[0],
        resize: true,
        height: 50,
        model: {
          totalTime: Program.countTotalTime(entry.programSteps),
          steps: entry.programSteps
        }
      });

      var self = this;

      setTimeout(function() { self.plotView.render(); }, 1);
    }

    return this;
  };

  return HistoryEntryView;
});
