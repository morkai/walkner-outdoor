// Copyright (c) 2014, Łukasz Walukiewicz <lukasz@walukiewicz.eu>. Some Rights Reserved.
// Licensed under CC BY-NC-SA 4.0 <http://creativecommons.org/licenses/by-nc-sa/4.0/>.
// Part of the walkner-outdoor project <http://lukasz.walukiewicz.eu/p/walkner-outdoor>

define(
[
  'Backbone',

  'app/models/Controller'
],
/**
 * @param {Backbone} Backbone
 * @param {function(new:Controller)} Controller
 */
function(Backbone, Controller)
{
  /**
   * @class Controllers
   * @extends Backbone.Collection
   * @constructor
   * @param {Array.<Controller>} [models]
   * @param {Object} [options]
   */
  var Controllers = Backbone.Collection.extend({
    model: Controller,
    url: '/controllers'
  });

  return Controllers;
});
