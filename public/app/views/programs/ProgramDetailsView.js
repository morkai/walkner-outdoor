define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/views/viewport',
  'app/views/PageLayout',
  'app/views/programs/ProgramStepsPlotView',
  'app/views/programs/ProgramStepsTableView',
  'app/views/programs/DeleteProgramView',

  'text!app/templates/programs/details.html'
],
/**
 * @param {jQuery} $
 * @param {Underscore} _
 * @param {Backbone} Backbone
 * @param {Viewport} viewport
 * @param {function(new:PageLayout)} PageLayout
 * @param {function(new:ProgramStepsPlotView)} ProgramStepsPlotView
 * @param {function(new:ProgramStepsTableView)} ProgramStepsTableView
 * @param {function(new:DeleteProgramView)} DeleteProgramView
 * @param {String} detailsTpl
 */
function(
  $,
  _,
  Backbone,
  viewport,
  PageLayout,
  ProgramStepsPlotView,
  ProgramStepsTableView,
  DeleteProgramView,
  detailsTpl)
{
  /**
   * @class ProgramDetailsView
   * @constructor
   * @extends Backbone.View
   * @param {Object} [options]
   */
  var ProgramDetailsView = Backbone.View.extend({
    helpHash: 'programs-view',
    template: _.template(detailsTpl),
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
      var id = model.id;

      return [
        {
          href: '#programs/' + id + ';edit',
          text: 'Edytuj',
          privileges: 'managePrograms'
        },
        {
          href: '#programs/' + id + ';delete',
          text: 'Usuń',
          privileges: 'managePrograms',
          handler: function(e)
          {
            if (e.button !== 0)
            {
              return;
            }

            viewport.showDialog(new DeleteProgramView({model: model}));

            return false;
          }
        }
      ];
    }
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
