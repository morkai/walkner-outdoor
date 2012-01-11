define(
[
  'Underscore',
  'Backbone'
],
/**
 * @param {Underscore} _
 * @param {Backbone} Backbone
 */
function(_, Backbone)
{
  /**
   * @class User
   * @extends Backbone.Model
   * @constructor
   * @param {Object} [attributes]
   * @param {Object} [options]
   */
  var User = Backbone.Model.extend({
    urlRoot : '/users',
    defaults: {
      name      : '',
      email     : '',
      login     : '',
      password  : '',
      password2 : '',
      pin       : '',
      pin2      : '',
      privilages: {}
    }
  });

  /**
   * @return {Object}
   */
  User.prototype.toTemplateData = function()
  {
    var data = this.toJSON();

    return data;
  };

  return User;
});
