// Copyright (c) 2014, Łukasz Walukiewicz <lukasz@walukiewicz.eu>. Some Rights Reserved.
// Licensed under CC BY-NC-SA 4.0 <http://creativecommons.org/licenses/by-nc-sa/4.0/>.
// Part of the walkner-outdoor project <http://lukasz.walukiewicz.eu/p/walkner-outdoor>

define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/views/dashboard/zoneStateViews'
],
/**
 * @param {jQuery} $
 * @param {Underscore} _
 * @param {Backbone} Backbone
 * @param {Object} zoneStateViews
 */
function(
  $,
  _,
  Backbone,
  zoneStateViews)
{
  /**
   * @class ActiveZoneView
   * @constructor
   * @extends Backbone.View
   * @param {Object} [options]
   */
  var ActiveZoneView = Backbone.View.extend({
    tagName: 'li',
    className: 'activeZone'
  });

  ActiveZoneView.prototype.initialize = function()
  {
    this.stateView = null;
    this.timers = {};
    this.renderCount = 0;

    this.model.bind('change:state', this.render, this);
  };

  ActiveZoneView.prototype.destroy = function()
  {
    for (var timer in this.timers)
    {
      clearTimeout(this.timers[timer]);
    }

    this.model.unbind('change:state', this.render, this);

    _.destruct(this, 'stateView');

    this.remove();
  };

  /**
   * @return {ActiveZoneView}
   */
  ActiveZoneView.prototype.render = function()
  {
    var state = this.model.get('state');
    var StateView = zoneStateViews[state];

    if (!StateView)
    {
      return this;
    }

    if (this.stateView)
    {
      this.stateView.destroy();
    }

    this.stateView = new StateView({model: this.model});

    $(this.el)
      .empty()
      .attr('data-id', this.model.id)
      .append(this.stateView.render().el);

    if (this.renderCount > 0)
    {
      this.highlight(3);
    }

    this.renderCount += 1;

    return this;
  };

  /**
   * @private
   */
  ActiveZoneView.prototype.highlight = function(timesRemaining)
  {
    timesRemaining -= 1;

    var activeZoneView = this;
    var stateEl = this.$('.state').addClass('highlight');

    this.timers.highlight = _.timeout(200, function()
    {
      stateEl.removeClass('highlight');

      if (timesRemaining)
      {
        activeZoneView.timers.highlight = _.timeout(200, function()
        {
          activeZoneView.highlight(timesRemaining);
        });
      }
    });
  };

  return ActiveZoneView;
});
