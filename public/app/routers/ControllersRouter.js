define(
[
  'Backbone',

  'app/models/Controller',
  'app/models/Controllers',
  'app/views/viewport',
  'app/views/controllers/ControllerListView',
  'app/views/controllers/AddControllerFormView',
  'app/views/controllers/ControllerDetailsView',
  'app/views/controllers/EditControllerFormView',
  'app/views/controllers/DeleteControllerView'
],
/**
 * @param {Backbone} Backbone
 * @param {function(new:Controller)} Controller
 * @param {function(new:Controllers)} Controllers
 * @param {Viewport} viewport
 * @param {function(new:ControllerListView)} ControllerListView
 * @param {function(new:AddControllerFormView)} AddControllerFormView
 * @param {function(new:ControllerDetailsView)} ControllerDetailsView
 * @param {function(new:EditControllerFormView)} EditControllerFormView
 * @param {function(new:DeleteControllerView)} DeleteControllerView
 */
function(
  Backbone,
  Controller,
  Controllers,
  viewport,
  ControllerListView,
  AddControllerFormView,
  ControllerDetailsView,
  EditControllerFormView,
  DeleteControllerView)
{
  /**
   * @class ControllersRouter
   * @constructor
   * @extends Backbone.Router
   * @param {Object} [options]
   */
  var ControllersRouter = Backbone.Router.extend({
    routes: {
      'controllers'           : 'list',
      'controllers;add'       : 'add',
      'controllers/:id'       : 'view',
      'controllers/:id;edit'  : 'edit',
      'controllers/:id;delete': 'del'
    }
  });

  ControllersRouter.prototype.list = function()
  {
    if (viewport.msg.auth('viewControllers'))
    {
      return;
    }

    viewport.msg.loading();

    new Controllers().fetch({
      data: {
        fields: ['name']
      },
      success: function(collection)
      {
        viewport.showView(new ControllerListView({collection: collection}));
      },
      error: function()
      {
        viewport.msg.loadingFailed();
      }
    });
  };

  ControllersRouter.prototype.add = function()
  {
    if (viewport.msg.auth('manageControllers'))
    {
      return;
    }

    viewport.showView(new AddControllerFormView({model: new Controller()}));
  };

  ControllersRouter.prototype.view = function(id)
  {
    if (viewport.msg.auth('viewControllers'))
    {
      return;
    }

    viewport.msg.loading();

    new Controller({_id: id}).fetch({
      success: function(model)
      {
        viewport.showView(new ControllerDetailsView({model: model}));
      },
      error: function()
      {
        viewport.msg.loadingFailed();
      }
    });
  };

  ControllersRouter.prototype.edit = function(id)
  {
    if (viewport.msg.auth('manageControllers'))
    {
      return;
    }

    viewport.msg.loading();

    new Controller({_id: id}).fetch({
      success: function(model)
      {
        viewport.showView(new EditControllerFormView({model: model}));
      },
      error: function()
      {
        viewport.msg.loadingFailed();
      }
    });
  };

  ControllersRouter.prototype.del = function(id)
  {
    if (viewport.msg.auth('manageControllers'))
    {
      return;
    }

    viewport.msg.loading();

    new Controller({_id: id}).fetch({
      success: function(model)
      {
        viewport.showView(new DeleteControllerView({model: model}));
      },
      error: function()
      {
        viewport.msg.loadingFailed();
      }
    });
  };

  return ControllersRouter;
});
