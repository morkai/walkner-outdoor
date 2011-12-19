define(
[
  'Backbone',

  'app/views/todo'
],
/**
 * @param {Backbone} Backbone
 * @param {Function} tbd
 */
function(Backbone, tbd)
{

/**
 * @class UsersRouter
 * @constructor
 * @extends Backbone.Router
 * @param {Object} [options]
 */
var UsersRouter = Backbone.Router.extend({
  routes: {
    'users': 'list'
  }
});

UsersRouter.prototype.list = function()
{
  tbd();
};

return UsersRouter;

});
