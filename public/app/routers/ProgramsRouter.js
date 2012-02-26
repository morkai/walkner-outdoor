define(
[
  'Backbone',

  'app/models/Program',
  'app/models/Programs',
  'app/views/viewport',
  'app/views/programs/ProgramListView',
  'app/views/programs/AddProgramFormView',
  'app/views/programs/ProgramDetailsPageView',
  'app/views/programs/EditProgramFormView',
  'app/views/programs/DeleteProgramView'
],
/**
 * @param {Backbone} Backbone
 * @param {function(new:Program)} Program
 * @param {function(new:Programs)} Programs
 * @param {Viewport} viewport
 * @param {function(new:ProgramListView)} ProgramListView
 * @param {function(new:AddProgramFormView)} AddProgramFormView
 * @param {function(new:ProgramDetailsPageView)} ProgramDetailsPageView
 * @param {function(new:EditProgramFormView)} EditProgramFormView
 * @param {function(new:DeleteProgramView)} DeleteProgramView
 */
function(
  Backbone,
  Program,
  Programs,
  viewport,
  ProgramListView,
  AddProgramFormView,
  ProgramDetailsPageView,
  EditProgramFormView,
  DeleteProgramView)
{
  /**
   * @class ProgramsRouter
   * @constructor
   * @extends Backbone.Router
   * @param {Object} [options]
   */
  var ProgramsRouter = Backbone.Router.extend({
    routes: {
      'programs': 'list',
      'programs;add': 'add',
      'programs/:id': 'view',
      'programs/:id;edit': 'edit',
      'programs/:id;delete': 'del'
    }
  });

  ProgramsRouter.prototype.list = function()
  {
    if (viewport.msg.auth('viewPrograms'))
    {
      return;
    }

    viewport.msg.loading();

    new Programs().fetch({
      data: {
        fields: ['name']
      },
      success: function(collection)
      {
        viewport.showView(new ProgramListView({collection: collection}));
      },
      error: function()
      {
        viewport.msg.loadingFailed();
      }
    });
  };

  ProgramsRouter.prototype.add = function()
  {
    if (viewport.msg.auth('managePrograms'))
    {
      return;
    }

    viewport.showView(new AddProgramFormView({model: new Program()}));
  };

  ProgramsRouter.prototype.view = function(id)
  {
    if (viewport.msg.auth('viewPrograms'))
    {
      return;
    }

    viewport.msg.loading();

    new Program({_id: id}).fetch({
      success: function(model)
      {
        viewport.showView(new ProgramDetailsPageView({model: model}));
      },
      error: function()
      {
        viewport.msg.loadingFailed();
      }
    });
  };

  ProgramsRouter.prototype.edit = function(id)
  {
    if (viewport.msg.auth('managePrograms'))
    {
      return;
    }

    viewport.msg.loading();

    new Program({_id: id}).fetch({
      success: function(model)
      {
        viewport.showView(new EditProgramFormView({model: model}));
      },
      error: function()
      {
        viewport.msg.loadingFailed();
      }
    });
  };

  ProgramsRouter.prototype.del = function(id)
  {
    if (viewport.msg.auth('managePrograms'))
    {
      return;
    }

    viewport.msg.loading();

    new Program({_id: id}).fetch({
      success: function(model)
      {
        viewport.showView(new DeleteProgramView({model: model}));
      },
      error: function()
      {
        viewport.msg.loadingFailed();
      }
    });
  };

  return ProgramsRouter;
});
