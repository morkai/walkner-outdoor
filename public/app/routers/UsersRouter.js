define(
[
  'Backbone',

  'app/models/User',
  'app/models/Users',
  'app/views/viewport',
  'app/views/users/UserListView',
  'app/views/users/AddUserFormView',
  'app/views/users/UserDetailsView',
  'app/views/users/EditUserFormView',
  'app/views/users/DeleteUserView'
],
/**
 * @param {Backbone} Backbone
 * @param {function(new:User)} User
 * @param {function(new:Users)} Users
 * @param {Viewport} viewport
 * @param {function(new:UserListView)} UserListView
 * @param {function(new:AddUserFormView)} AddUserFormView
 * @param {function(new:UserDetailsView)} UserDetailsView
 * @param {function(new:EditUserFormView)} EditUserFormView
 * @param {function(new:DeleteUserView)} DeleteUserView
 */
function(
  Backbone,
  User,
  Users,
  viewport,
  UserListView,
  AddUserFormView,
  UserDetailsView,
  EditUserFormView,
  DeleteUserView)
{
  /**
   * @class UsersRouter
   * @constructor
   * @extends Backbone.Router
   * @param {Object} [options]
   */
  var UsersRouter = Backbone.Router.extend({
    routes: {
      'users': 'list',
      'users;add': 'add',
      'users/:id': 'view',
      'users/:id;edit': 'edit',
      'users/:id;delete': 'del'
    }
  });

  UsersRouter.prototype.list = function()
  {
    if (viewport.msg.auth('viewUsers'))
    {
      return;
    }

    viewport.msg.loading();

    new Users().fetch({
      data: {
        fields: ['name']
      },
      success: function(collection)
      {
        viewport.showView(new UserListView({collection: collection}));
      },
      error: function()
      {
        viewport.msg.loadingFailed();
      }
    });
  };

  UsersRouter.prototype.add = function()
  {
    if (viewport.msg.auth('manageUsers'))
    {
      return;
    }

    viewport.showView(new AddUserFormView({model: new User()}));
  };

  UsersRouter.prototype.view = function(id)
  {
    if (viewport.msg.auth('viewUsers'))
    {
      return;
    }

    viewport.msg.loading();

    new User({_id: id}).fetch({
      success: function(model)
      {
        viewport.showView(new UserDetailsView({model: model}));
      },
      error: function()
      {
        viewport.msg.loadingFailed();
      }
    });
  };

  UsersRouter.prototype.edit = function(id)
  {
    if (viewport.msg.auth('manageUsers'))
    {
      return;
    }

    viewport.msg.loading();

    new User({_id: id}).fetch({
      success: function(model)
      {
        viewport.showView(new EditUserFormView({model: model}));
      },
      error: function()
      {
        viewport.msg.loadingFailed();
      }
    });
  };

  UsersRouter.prototype.del = function(id)
  {
    if (viewport.msg.auth('manageUsers'))
    {
      return;
    }

    viewport.msg.loading();

    new User({_id: id}).fetch({
      success: function(model)
      {
        viewport.showView(new DeleteUserView({model: model}));
      },
      error: function()
      {
        viewport.msg.loadingFailed();
      }
    });
  };

  return UsersRouter;
});
