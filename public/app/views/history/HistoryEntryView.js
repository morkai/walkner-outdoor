define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/models/Program',
  'app/views/PageLayout',
  'app/views/viewport',
  'app/views/programs/ProgramStepsPlotView',
  'app/views/programs/ProgramStepsTableView',

  'text!app/templates/history/entry.html'
],
function(
  $,
  _,
  Backbone,
  Program,
  PageLayout,
  viewport,
  ProgramStepsPlotView,
  ProgramStepsTableView,
  entryTpl)
{
  var renderEntry = _.template(entryTpl);

  return Backbone.View.extend({

    layout: PageLayout,

    breadcrumbs: function()
    {
      return [
        {href: '#history', text: 'Historia'},
        'Wpis'
      ];
    },

    initialize: function()
    {
      this.tableView = null;
      this.plotView  = null;
    },

    destroy: function()
    {
      _.destruct(this, 'tableView', 'plotView');

      this.remove();
    },

    render: function()
    {
      var entry = this.model.toTemplateData();

      this.el.innerHTML = renderEntry({entry: entry});

      if (entry.programSteps.length)
      {
        this.tableView = new ProgramStepsTableView({
          readOnly: true,
          steps   : entry.programSteps
        }).replace(this.el);

        this.plotView = new ProgramStepsPlotView({
          el    : this.$('.program-plot')[0],
          resize: true,
          height: 50,
          model : {
            totalTime: Program.countTotalTime(entry.programSteps),
            steps    : entry.programSteps
          }
        });

        var self = this;

        setTimeout(function() { self.plotView.render(); }, 1);
      }

      return this;
    }
  });
});
