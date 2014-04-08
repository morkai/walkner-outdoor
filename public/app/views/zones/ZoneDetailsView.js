// Copyright (c) 2014, Łukasz Walukiewicz <lukasz@walukiewicz.eu>. Some Rights Reserved.
// Licensed under CC BY-NC-SA 4.0 <http://creativecommons.org/licenses/by-nc-sa/4.0/>.
// Part of the walkner-outdoor project <http://lukasz.walukiewicz.eu/p/walkner-outdoor>

define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/views/viewport',
  'app/views/PageLayout',
  'app/views/zones/DeleteZoneView',

  'text!app/templates/zones/details.html'
],
/**
 * @param {jQuery} $
 * @param {Underscore} _
 * @param {Backbone} Backbone
 * @param {Viewport} viewport
 * @param {function(new:PageLayout)} PageLayout
 * @param {function(new:DeleteZoneView)} DeleteZoneView
 * @param {String} detailsTpl
 */
function($, _, Backbone, viewport, PageLayout, DeleteZoneView, detailsTpl)
{
  /**
   * @class ZoneDetailsView
   * @constructor
   * @extends Backbone.View
   * @param {Object} [options]
   */
  var ZoneDetailsView = Backbone.View.extend({
    template: _.template(detailsTpl)
  });

  ZoneDetailsView.prototype.destroy = function()
  {
    this.remove();
  };

  ZoneDetailsView.prototype.render = function()
  {
    this.el.innerHTML = this.template({
      zone: this.model.toTemplateData()
    });

    return this;
  };

  return ZoneDetailsView;
});
