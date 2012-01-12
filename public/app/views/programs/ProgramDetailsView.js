define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/views/PageLayout',
  'app/views/viewport',
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
          privilages: 'managePrograms'
        },
        {
          href      : '#programs/' + id + ';delete',
          text      : 'Usuń',
          privilages: 'managePrograms',
          handler   : function(e)
          {
            if (e.button !== 0) return;

            viewport.showDialog(new DeleteProgramView({model: model}));

            return false;
          }
        }
      ];
    },

    destroy: function()
    {
      this.remove();
    },

    render: function()
    {
      var program = this.model.toTemplateData();

      this.el.innerHTML = renderDetails({program: program});

      if (program.steps.length)
      {
        new ProgramStepsTableView({
          readOnly: true,
          steps: program.steps
        }).replace(this.el);
      }

      return this;
    }
  });
});
