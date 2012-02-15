define(
[
  'Backbone',

  'app/models/User'
],
/**
 * @param {Backbone} Backbone
 * @param {function(new:User)} User
 */
function(Backbone, User)
{
  /**
   * @class Users
   * @extends Backbone.Collection
   * @constructor
   * @param {Array.<User>} [models]
   * @param {Object} [options]
   */
  var Users = Backbone.Collection.extend({
    model: User,
    url: '/users'
  });

  return Users;
});
