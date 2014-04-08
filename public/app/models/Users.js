// Copyright (c) 2014, Łukasz Walukiewicz <lukasz@walukiewicz.eu>. Some Rights Reserved.
// Licensed under CC BY-NC-SA 4.0 <http://creativecommons.org/licenses/by-nc-sa/4.0/>.
// Part of the walkner-outdoor project <http://lukasz.walukiewicz.eu/p/walkner-outdoor>

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
