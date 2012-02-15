define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/socket',
  'app/models/Program',
  'app/views/viewport',
  'app/views/programs/ProgramDetailsView',
  'app/views/dashboard/ActiveZoneView'
],
/**
 * @param {jQuery} $
 * @param {Underscore} _
 * @param {Backbone} Backbone
 * @param {io.SocketNamespace} socket
 * @param {function(new:Program)} Program
 * @param {Viewport} viewport
 * @param {function(new:ProgramDetailsView)} ProgramDetailsView
 * @param {function(new:ActiveZoneView)} ActiveZoneView
 */
function(
  $,
  _,
  Backbone,
  socket,
  Program,
  viewport,
  ProgramDetailsView,
  ActiveZoneView)
{
  /**
   * @class ActiveZonesView
   * @constructor
   * @extends Backbone.View
   * @param {Object} [options]
   */
  var ActiveZonesView = Backbone.View.extend({
    tagName: 'ul',
    className: 'activeZones',
    events: {
      'click .programPreview': 'showProgramPreviewDialog'
    },
    topics: {
      'zone state changed': 'zoneStateChanged',
      'zone started': 'onZoneStart',
      'zone stopped': 'onZoneStop',
      'connect': 'refresh'
    }
  });

  ActiveZonesView.prototype.initialize = function()
  {
    _.bindAll.apply(null, [this].concat(_.values(this.topics)));

    this.adjustBoxes = _.debounce(_.bind(this.adjustBoxes, this), 100);

    this.activeZoneViews = {};

    this.collection.bind('reset', this.render, this);
    this.collection.bind('add', this.activeZoneAdded, this);
    this.collection.bind('remove', this.activeZoneRemoved, this);

    _.each(this.topics, function(handler, topic)
    {
      socket.on(topic, this[handler]);
    }, this);

    $(window).on('resize', this.adjustBoxes);
  };

  ActiveZonesView.prototype.destroy = function()
  {
    _.each(this.topics, function(handler, topic)
    {
      socket.removeListener(topic, this[handler]);
    }, this);

    $(window).off('resize', this.adjustBoxes);

    this.collection.unbind('reset', this.render, this);
    this.collection.unbind('add', this.activeZoneAdded, this);
    this.collection.unbind('remove', this.activeZoneRemoved, this);

    _.destruct(this, 'activeZoneViews');

    this.remove();
  };

  /**
   * @return {ActiveZonesView}
   */
  ActiveZonesView.prototype.render = function()
  {
    this.el.innerHTML = '';

    var activeZonesView = this;

    this.collection.each(function(activeZone)
    {
      activeZonesView.activeZoneAdded(activeZone);
    });

    this.adjustBoxes();

    return this;
  };

  /**
   * @private
   */
  ActiveZonesView.prototype.adjustBoxes = function()
  {
    var windowHeight = window.innerHeight - 10;
    var layoutEl = $('.layout').first();
    var zonesEl = $(this.el);
    var fontSize = 1.2;

    do
    {
      zonesEl.css('font-size', fontSize.toFixed(2) + 'em');

      fontSize -= .05;
    }
    while (fontSize > .7 && windowHeight < layoutEl.outerHeight(true));
  };

  /**
   * @private
   * @param {Object} e
   */
  ActiveZonesView.prototype.showProgramPreviewDialog = function(e)
  {
    if (e)
    {
      e.preventDefault();
    }

    var el = $(e.target);
    var zoneId = el.closest('.activeZone').attr('data-id');
    var activeZone = this.collection.get(zoneId);
    var programProperty = el.attr('data-programProperty');
    var program = new Program(activeZone.get(programProperty));

    viewport.showDialog(new ProgramDetailsView({model: program}));
  };

  /**
   * @private
   * @param {ActiveZone} activeZone
   */
  ActiveZonesView.prototype.activeZoneAdded = function(activeZone)
  {
    var activeZoneView = new ActiveZoneView({model: activeZone});

    activeZoneView.render();

    var position = this.collection.indexOf(activeZone);

    if (position === 0)
    {
      $(this.el).append(activeZoneView.el);
    }
    else
    {
      $(activeZoneView.el).insertAfter(
        this.activeZoneViews[this.collection.at(position - 1).id].el
      );
    }

    this.activeZoneViews[activeZone.id] = activeZoneView;

    this.adjustBoxes();
  };

  /**
   * @private
   * @param {ActiveZone} activeZone
   */
  ActiveZonesView.prototype.activeZoneRemoved = function(activeZone)
  {
    var activeZoneView = this.activeZoneViews[activeZone.id];

    if (!activeZoneView)
    {
      return;
    }

    delete this.activeZoneViews[activeZone.id];

    activeZoneView.destroy();

    this.adjustBoxes();
  };

  /**
   * @private
   * @param {Object} activeZone
   */
  ActiveZonesView.prototype.onZoneStart = function(activeZone)
  {
    console.log('zone started', activeZone._id);
    this.collection.add(activeZone);
  };

  /**
   * @private
   * @param {String} zoneId
   */
  ActiveZonesView.prototype.onZoneStop = function(zoneId)
  {
    console.log('zone stopped', zoneId);
    var activeZone = this.collection.get(zoneId);

    if (activeZone)
    {
      this.collection.remove(activeZone);
    }
  };

  /**
   * @private
   * @param {Object} data
   */
  ActiveZonesView.prototype.zoneStateChanged = function(data)
  {
    var activeZone = this.collection.get(data._id);

    if (activeZone)
    {
      activeZone.set(data);

      if (data.state)
      {
        this.adjustBoxes();
      }
    }
  };

  /**
   * @private
   */
  ActiveZonesView.prototype.refresh = function()
  {
    window.location.reload();
  };

  return ActiveZonesView;
});
