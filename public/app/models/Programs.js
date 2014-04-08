// Copyright (c) 2014, Łukasz Walukiewicz <lukasz@walukiewicz.eu>. Some Rights Reserved.
// Licensed under CC BY-NC-SA 4.0 <http://creativecommons.org/licenses/by-nc-sa/4.0/>.
// Part of the walkner-outdoor project <http://lukasz.walukiewicz.eu/p/walkner-outdoor>

define(
[
  'Backbone',

  'app/models/Program'
],
/**
 * @param {Backbone} Backbone
 * @param {function(new:Program)} Program
 */
function(Backbone, Program)
{
  /**
   * @class Programs
   * @extends Backbone.Collection
   * @constructor
   * @param {Array.<Program>} [models]
   * @param {Object} [options]
   */
  var Programs = Backbone.Collection.extend({
    model: Program,
    url: '/programs'
  });

  return Programs;
});
