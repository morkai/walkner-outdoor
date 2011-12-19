define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/socket',
  'app/views/ZoneView'
],
/**
 * @param {jQuery} $
 * @param {Underscore} _
 * @param {Backbone} Backbone
 * @param {io.SocketNamespace} socket
 * @param {function(new:ZoneView)} ZoneView
 */
function($, _, Backbone, socket, ZoneView)
{

/**
 * @class DashboardView
 * @constructor
 * @extends Backbone.View
 * @param {Object} [options]
 */
var DashboardView = Backbone.View.extend({
  tagName  : 'ul',
  className: 'dashboard'
});

DashboardView.prototype.initialize = function()
{
  _.bindAll(this, 'onZoneStart', 'onZoneStop');

  this.adjustBoxes           = _.debounce(_.bind(this.adjustBoxes, this), 100);
  this.zoneViews             = [];
  this.progressUpdateTimeout = null;

  $(window).on('resize', this.adjustBoxes);

  this.collection.bind('change', this.adjustBoxes);

  socket.on('zone started', this.onZoneStart);
  socket.on('zone stopped', this.onZoneStop);
};

DashboardView.prototype.destroy = function()
{
  clearTimeout(this.progressUpdateTimeout);

  socket.removeListener('zone started', this.onZoneStart);
  socket.removeListener('zone stopped', this.onZoneStop);

  this.collection.unbind('change', this.adjustBoxes);

  $(window).off('resize', this.adjustBoxes);

  _.destruct(this, 'zoneViews');

  this.remove();
};

/**
 * @return {DashboardView}
 */
DashboardView.prototype.render = function()
{
  this.el.innerHTML = '';

  this.renderZones();
  this.adjustBoxes();
  this.setUpProgressUpdater();

  return this;
};

/**
 * @private
 */
DashboardView.prototype.renderZones = function()
{
  _.destruct(this, 'zoneViews');
  this.zoneViews = [];

  var dashboardView = this;

  this.collection.each(function(model)
  {
    var zoneView = new ZoneView({model: model});

    zoneView.render();

    $('<li></li>').append(zoneView.el).appendTo(dashboardView.el);

    dashboardView.zoneViews.push(zoneView);
  });
};

/**
 * @private
 */
DashboardView.prototype.adjustBoxes = function()
{
  var windowHeight = window.innerHeight - 10;
  var layoutEl     = $('.layout').first();
  var zonesEl      = $(this.el);
  var fontSize     = 2;

  do
  {
    zonesEl.css('font-size', fontSize + 'em');

    fontSize -= .05;
  }
  while (fontSize > .7 && windowHeight < layoutEl.outerHeight(true));
};

/**
 * @private
 */
DashboardView.prototype.setUpProgressUpdater = function()
{
  clearTimeout(this.progressUpdateTimeout);

  var dashboardView = this;

  function updateProgress()
  {
    _.invoke(dashboardView.zoneViews, 'updateProgress');

    dashboardView.progressUpdateTimeout = setTimeout(updateProgress, 1000);
  }

  updateProgress();
};

/**
 * @private
 */
DashboardView.prototype.onZoneStart = function(message)
{
  var zone = this.collection.get(message.zone);

  if (zone)
  {
    zone.set({state: message.state});
  }
};

/**
 * @private
 */
DashboardView.prototype.onZoneStop = function(message)
{
  var zone = this.collection.get(message.zone);

  if (zone)
  {
    zone.set({state: null});
  }
};

return DashboardView;

});
