define(
[
  'jQuery',
  'Backbone',

  'app/models/ActiveZones',
  'app/views/viewport',
  'app/views/dashboard/ActiveZonesView',
  'app/views/LoginView',
  'app/views/LogoutView',
  'app/views/diag/DiagView'
],
/**
 * @param {jQuery} jQuery
 * @param {Backbone} Backbone
 * @param {function(new:Zones)} Zones
 * @param {Viewport} viewport
 * @param {function(new:ActiveZonesView)} ActiveZonesView
 * @param {function(new:LoginView)} LoginView
 * @param {function(new:LogoutView)} LogoutView
 * @param {function(new:DiagView)} DiagView
 */
function(
  $,
  Backbone,
  ActiveZones,
  viewport,
  ActiveZonesView,
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
      '': 'dashboard',
      'login': 'login',
      'logout': 'logout',
      'diag': 'diagnose'
    }
  });

  HomeRouter.prototype.dashboard = function()
  {
    var activeZones = new ActiveZones();

    viewport.showView(new ActiveZonesView({collection: activeZones}));

    activeZones.fetch();
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
    if (viewport.msg.auth('diag'))
    {
      return;
    }

    viewport.msg.loading();

    $.ajax({
      url: '/diag',
      success: function(diag)
      {
        viewport.showView(new DiagView({model: diag}));
      },
      error: function()
      {
        viewport.msg.loadingFailed();
      }
    });
  };

  return HomeRouter;
});
