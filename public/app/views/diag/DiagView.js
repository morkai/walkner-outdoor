define(
[
  'jQuery',
  'Underscore',
  'Backbone',
  'moment',

  'app/socket',
  'app/views/viewport',
  'app/views/PageLayout',
  'app/views/diag/ControllerDiagView',
  'app/views/diag/ZoneDiagView',
  'app/views/diag/ProgramDiagView',

  'text!app/templates/diag/diag.html'
],
/**
 * @param {jQuery} $
 * @param {Underscore} _
 * @param {Backbone} Backbone
 * @param {moment} moment
 * @param {io.SocketNamespace} socket
 * @param {Viewport} viewport
 * @param {function(new:PageLayout)} PageLayout
 * @param {function(new:ControllerDiagView)} ControllerDiagView
 * @param {function(new:ZoneDiagView)} ZoneDiagView
 * @param {function(new:ProgramDiagView)} ProgramDiagView
 * @param {String} diagTpl
 */
function(
  $,
  _,
  Backbone,
  moment,
  socket,
  viewport,
  PageLayout,
  ControllerDiagView,
  ZoneDiagView,
  ProgramDiagView,
  diagTpl)
{
  /**
   * @class DiagView
   * @constructor
   * @extends Backbone.View
   * @param {Object} [options]
   */
  var DiagView = Backbone.View.extend({
    template: _.template(diagTpl),
    layout: PageLayout,
    className: 'diag',
    topics: {
      'controller started': 'onControllerStart',
      'controller stopped': 'onControllerStop',
      'controller added': 'addController',
      'controller removed': 'removeController',
      'controller timed': 'onControllerTime',
      'zone started': 'onZoneStart',
      'zone stopped': 'onZoneStop',
      'zone added': 'addZone',
      'zone removed': 'removeZone',
      'zone state changed': 'onZoneStateChange',
      'program started': 'onProgramStart',
      'program stopped': 'onProgramStop',
      'reconnect': 'refresh'
    }
  });

  DiagView.prototype.initialize = function()
  {
    _.bindAll(this, 'updateUptime');
    _.bindAll.apply(null, [this].concat(_.values(this.topics)));

    for (var topic in this.topics)
    {
      socket.on(topic, this[this.topics[topic]]);
    }

    this.controllerViews = {};
    this.zoneViews = {};
    this.programViews = {};

    this.uptimeTimer = null;
  };

  DiagView.prototype.destroy = function()
  {
    clearTimeout(this.uptimeTimer);

    for (var topic in this.topics)
    {
      socket.removeListener(topic, this[this.topics[topic]]);
    }

    _.destruct(this, 'controllerViews', 'zoneViews', 'programViews');

    this.remove();

    this.controllerViews = null;
    this.zoneViews = null;
    this.programViews = null;
  };

  DiagView.prototype.render = function()
  {
    var startedAt = moment(this.model.startTime);

    this.el.innerHTML = this.template({
      startTime: startedAt.valueOf(),
      startedAt: startedAt.format('LLLL'),
      eth0: this.model.eth0.join(', '),
      wlan0: this.model.wlan0.join(', ')
    });

    this.renderControllers();
    this.renderZones();
    this.renderPrograms();

    this.updateUptime();

    return this;
  };

  /**
   * @private
   */
  DiagView.prototype.renderControllers = function()
  {
    var controllers = this.model.controllers;

    if (controllers.length === 0)
    {
      return;
    }

    this.$('.noControllersMessage').hide();

    _.each(controllers, this.addController, this);
  };

  /**
   * @private
   */
  DiagView.prototype.renderZones = function()
  {
    var zones = this.model.zones;

    if (zones.length === 0)
    {
      return;
    }

    this.$('.noZonesMessage').hide();

    _.each(zones, this.addZone, this);
  };

  /**
   * @private
   */
  DiagView.prototype.renderPrograms = function()
  {
    var programs = this.model.programs;

    if (programs.length === 0)
    {
      return;
    }

    this.$('.noProgramsMessage').hide();

    _.each(programs, this.addProgram, this);
  };

  /**
   * @private
   * @param {Object} controller
   */
  DiagView.prototype.addController = function(controller)
  {
    var controllerView = new ControllerDiagView({model: controller});

    this.$('.noControllersMessage').hide();
    this.$('.controllers').append(controllerView.render().el);

    this.controllerViews[controller._id] = controllerView;
  };

  /**
   * @private
   * @param {String} id
   */
  DiagView.prototype.removeController = function(id)
  {
    var controllerView = this.controllerViews[id];

    if (!controllerView)
    {
      return;
    }

    delete this.controllerViews[id];

    controllerView.destroy();

    if (_.size(this.controllerViews) === 0)
    {
      this.$('.noControllersMessage').show();
    }
  };

  /**
   * @private
   * @param {String} zone
   */
  DiagView.prototype.addZone = function(zone)
  {
    if (zone.controller)
    {
      var controller = _.find(this.model.controllers, function(controller)
      {
        return controller._id === zone.controller;
      });

      zone.controller = {
        _id: controller._id,
        name: controller.name
      };
    }

    var zoneView = new ZoneDiagView({model: zone});

    this.$('.noZonesMessage').hide();
    this.$('.zones').append(zoneView.render().el);

    this.zoneViews[zone._id] = zoneView;
  };

  /**
   * @private
   * @param {String} id
   */
  DiagView.prototype.removeZone = function(id)
  {
    var zoneView = this.zoneViews[id];

    if (!zoneView)
    {
      return;
    }

    delete this.zoneViews[id];

    zoneView.destroy();

    if (_.size(this.zoneViews) === 0)
    {
      this.$('.noZonesMessage').show();
    }
  };

  /**
   * @private
   * @param {Object} data
   */
  DiagView.prototype.onZoneStateChange = function(data)
  {
    if (!data.state)
    {
      return;
    }

    if (data.state === 'programRunning')
    {
      console.log(data);

      this.addProgram({
        _id: data.historyEntry,
        zoneId: data._id,
        zoneName: this.zoneViews[data._id].model.name,
        programId: data.program._id,
        programName: data.program.name,
        startUserId: data.program.startUser
          ? data.program.startUser._id : null,
        startUserName: data.program.startUser
          ? data.program.startUser.name : null,
        startTime: data.program.startTime
      });
    }
    else
    {
      for (var historyId in this.programViews)
      {
        var programView = this.programViews[historyId];

        if (programView.model.zoneId === data._id)
        {
          this.removeProgram(historyId);

          break;
        }
      }
    }
  };

  /**
   * @private
   * @param {Object} historyEntry
   */
  DiagView.prototype.addProgram = function(historyEntry)
  {
    var programView = new ProgramDiagView({model: historyEntry});

    this.$('.noProgramsMessage').hide();
    this.$('.programs').append(programView.render().el);

    this.programViews[historyEntry.id] = programView;
  };

  /**
   * @private
   * @param {String} id
   */
  DiagView.prototype.removeProgram = function(id)
  {
    var programView = this.programViews[id];

    if (!programView)
    {
      return;
    }

    delete this.programViews[id];

    programView.destroy();

    if (_.size(this.programViews) === 0)
    {
      this.$('.noProgramsMessage').show();
    }
  };

  /**
   * @private
   */
  DiagView.prototype.updateUptime = function()
  {
    var now = Date.now();

    this.$('.property[data-property="uptime"] .property-value').each(function()
    {
      var $el = $(this);
      var startTime = parseInt($el.attr('data-startTime'));
      var seconds = (now - startTime) / 1000;
      var uptime;

      if (seconds < 60)
      {
        uptime = Math.round(seconds) + ' s';
      }
      else
      {
        uptime = Math.round(seconds / 60) + ' min';
      }

      $el.text(uptime);
    });

    setTimeout(this.updateUptime, 1000);
  };

  /**
   * @private
   * @param {String} id
   */
  DiagView.prototype.onControllerStart = function(id)
  {
    var controllerView = this.controllerViews[id];

    if (!controllerView)
    {
      return;
    }

    controllerView.started();
  };

  /**
   * @private
   * @param {String} id
   */
  DiagView.prototype.onControllerStop = function(id)
  {
    var controllerView = this.controllerViews[id];

    if (!controllerView)
    {
      return;
    }

    controllerView.stopped();
  };

  /**
   * @private
   * @param {Object} data
   */
  DiagView.prototype.onControllerTime = function(data)
  {
    var controllerView = this.controllerViews[data.controllerId];

    if (!controllerView)
    {
      return;
    }

    controllerView.timed(data.results);
  };

  /**
   * @private
   * @param {Object} data
   */
  DiagView.prototype.onZoneStart = function(data)
  {
    var zoneView = this.zoneViews[data._id];

    if (!zoneView)
    {
      return;
    }

    zoneView.started();
  };

  /**
   * @private
   * @param {Object} id
   */
  DiagView.prototype.onZoneStop = function(id)
  {
    var zoneView = this.zoneViews[id];

    if (!zoneView)
    {
      return;
    }

    zoneView.stopped();
  };

  /**
   * @private
   * @param {Object} data
   */
  DiagView.prototype.onProgramStart = function(data)
  {
    this.addProgram(data);

    var zoneView = this.zoneViews[data.zoneId];

    if (zoneView)
    {
      zoneView.programStarted({id: data.programId, name: data.programName});
    }
  };

  /**
   * @private
   * @param {Object} data
   */
  DiagView.prototype.onProgramStop = function(data)
  {
    this.removeProgram(data._id);

    var zoneView = this.zoneViews[data.zoneId];

    if (zoneView)
    {
      zoneView.programStopped();
    }
  };

  /**
   * @private
   */
  DiagView.prototype.refresh = function()
  {
    window.location.reload();
  }

  return DiagView;
});
