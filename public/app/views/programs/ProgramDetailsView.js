define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/views/PageLayout',
  'app/views/viewport',
  'app/views/programs/ProgramStepsPlotView',
  'app/views/programs/ProgramStepsTableView',
  'app/views/programs/DeleteProgramView',

  'text!app/templates/programs/details.html'
],
function(
  $,
  _,
  Backbone,
  PageLayout,
  viewport,
  ProgramStepsPlotView,
  ProgramStepsTableView,
  DeleteProgramView,
  detailsTpl)
{
  var renderDetails = _.template(detailsTpl);

  return Backbone.View.extend({

    layout: PageLayout,

    breadcrumbs: function()
    {
      return [
        {href: '#programs', text: 'Programy'},
        this.model.get('name')
      ];
    },

    actions: function()
    {
      var model = this.model;
      var id    = model.get('_id');

      return [
        {
          href      : '#programs/' + id + ';edit',
          text      : 'Edytuj',
          privileges: 'managePrograms'
        },
        {
          href      : '#programs/' + id + ';delete',
          text      : 'Usuń',
          privileges: 'managePrograms',
          handler   : function(e)
          {
            if (e.button !== 0) return;

            viewport.showDialog(new DeleteProgramView({model: model}));

            return false;
          }
        }
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
      var program = this.model.toTemplateData();

      this.el.innerHTML = renderDetails({program: program});

      if (program.steps.length)
      {
        this.tableView = new ProgramStepsTableView({
          readOnly: true,
          steps   : program.steps
        }).replace(this.el);

        this.plotView = new ProgramStepsPlotView({
          el    : this.$('.program-plot')[0],
          resize: true,
          height: 50,
          model : {
            totalTime: this.model.countTotalTime(),
            steps    : this.model.get('steps')
          }
        });

        var self = this;

        setTimeout(function() { self.plotView.render(); }, 1);
      }

      return this;
    }

  });
});
