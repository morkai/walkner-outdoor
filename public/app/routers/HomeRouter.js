define(
[
  'jQuery',
  'Backbone',

  'app/models/Zones',
  'app/views/viewport',
  'app/views/DashboardView',
  'app/views/LoginView',
  'app/views/LogoutView',
  'app/views/DiagView'
],
/**
 * @param {jQuery} jQuery
 * @param {Backbone} Backbone
 * @param {function(new:Zones)} Zones
 * @param {Viewport} viewport
 * @param {function(new:DashboardView)} DashboardView
 * @param {function(new:LoginView)} LoginView
 * @param {function(new:LogoutView)} LogoutView
 * @param {function(new:DiagView)} DiagView
 */
function(
  $,
  Backbone,
  Zones,
  viewport,
  DashboardView,
  LoginView,
  LogoutView,
  DiagView)
{

/**
 * @class HomeRouter
 * @constructor
 * @extends Backbone.Router
 * @param {Object} [options]
 */
var HomeRouter = Backbone.Router.extend({
  routes: {
    ''      : 'dashboard',
    'login' : 'login',
    'logout': 'logout',
    'diag'  : 'diagnose'
  }
});

HomeRouter.prototype.dashboard = function()
{
  viewport.msg.loading();

  new Zones().fetch({
    data: {
      fields: ['name', 'state']
    },
    success: function(collection)
    {
      viewport.showView(new DashboardView({collection: collection}));
    },
    error: function()
    {
      viewport.msg.loadingFailed();
    }
  });
};

HomeRouter.prototype.login = function()
{
  viewport.showView(new LoginView());
};

HomeRouter.prototype.logout = function()
{
  viewport.showView(new LogoutView());
};

HomeRouter.prototype.diagnose = function()
{
  viewport.msg.loading();

  $.ajax({
    url    : '/diag',
    success: function(diag)
    {
      viewport.showView(new DiagView({model: diag}));
    },
    error  : function()
    {
      viewport.msg.loadingFailed();
    }
  });
};

return HomeRouter;

});
