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
  var renderDiag = _.template(diagTpl);

  return Backbone.View.extend({

    layout: PageLayout,

    className: 'diag',

    topics: {
      'controller started': 'onControllerStart',
      'controller stopped': 'onControllerStop',
      'controller added'  : 'addController',
      'controller removed': 'removeController',
      'zone started'      : 'onZoneStart',
      'zone stopped'      : 'onZoneStop',
      'zone added'        : 'addZone',
      'zone removed'      : 'removeZone',
      'program started'   : 'onProgramStart',
      'program stopped'   : 'onProgramStop',
      'reconnect'         : 'refresh'
    },

    initialize: function()
    {
      _.bindAll(this, 'updateUptime');
      _.bindAll.apply(null, [this].concat(_.values(this.topics)));

      _.each(this.topics, function(func, topic)
      {
        socket.on(topic, this[func]);
      }, this);

      this.controllerViews = {};
      this.zoneViews       = {};
      this.programViews    = {};

      this.uptimeTimer = null;
    },

    destroy: function()
    {
      clearTimeout(this.uptimeTimer);

      _.each(this.topics, function(func, topic)
      {
        socket.removeListener(topic, this[func]);
      }, this);

      _.destruct(this, 'controllerViews', 'zoneViews', 'programViews');

      $(this.el).remove();

      this.controllerViews =
      this.zoneViews       =
      this.programViews    =
      this.el              = null;
    },

    render: function()
    {
      var startedAt = moment(this.model.startTime);

      this.el.innerHTML = renderDiag({
        startTime: startedAt.valueOf(),
        startedAt: startedAt.format('LLLL')
      });

      this.renderControllers();
      this.renderZones();
      this.renderPrograms();

      this.updateUptime();

      return this;
    },

    renderControllers: function()
    {
      var controllers = this.model.controllers;

      if (controllers.length === 0)
      {
        return;
      }

      this.$('.noControllersMessage').hide();

      _.each(controllers, this.addController, this);
    },

    renderZones: function()
    {
      var zones = this.model.zones;

      if (zones.length === 0)
      {
        return;
      }

      this.$('.noZonesMessage').hide();

      _.each(zones, this.addZone, this);
    },

    renderPrograms: function()
    {
      var programs = this.model.programs;

      if (programs.length === 0)
      {
        return;
      }

      this.$('.noProgramsMessage').hide();

      _.each(programs, this.addProgram, this);
    },

    addController: function(controller)
    {
      var controllerView = new ControllerDiagView({model: controller});

      this.$('.noControllersMessage').hide();
      this.$('.controllers').append(controllerView.render().el);

      this.controllerViews[controller.id] = controllerView;
    },

    removeController: function(id)
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
    },

    addZone: function(zone)
    {
      if (zone.controller)
      {
        var controller = _.find(this.model.controllers, function(controller)
        {
          return controller.id === zone.controller;
        });

        zone.controller = {
          id  : controller.id,
          name: controller.name
        };
      }

      var zoneView = new ZoneDiagView({model: zone});

      this.$('.noZonesMessage').hide();
      this.$('.zones').append(zoneView.render().el);

      this.zoneViews[zone.id] = zoneView;
    },

    removeZone: function(id)
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
    },

    addProgram: function(historyEntry)
    {
      var programView = new ProgramDiagView({model: historyEntry});

      this.$('.noProgramsMessage').hide();
      this.$('.programs').append(programView.render().el);

      this.programViews[historyEntry.id] = programView;
    },

    removeProgram: function(id)
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
    },

    updateUptime: function()
    {
      var now = Date.now();

      this.$('.property[data-property="uptime"] .property-value').each(function()
      {
        var $el       = $(this);
        var startTime = parseInt($el.attr('data-startTime'));
        var seconds   = (now - startTime) / 1000;
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
    },

    onControllerStart: function(id)
    {
      var controllerView = this.controllerViews[id];

      if (!controllerView)
      {
        return;
      }

      controllerView.started();
    },

    onControllerStop: function(id)
    {
      var controllerView = this.controllerViews[id];

      if (!controllerView)
      {
        return;
      }

      controllerView.stopped();
    },

    onZoneStart: function(id)
    {
      var zoneView = this.zoneViews[id];

      if (!zoneView)
      {
        return;
      }

      zoneView.started();
    },

    onZoneStop: function(id)
    {
      var zoneView = this.zoneViews[id];

      if (!zoneView)
      {
        return;
      }

      zoneView.stopped();
    },

    onProgramStart: function(data)
    {
      this.addProgram(data);

      var zoneView = this.zoneViews[data.zoneId];

      if (zoneView)
      {
        zoneView.programStarted({id: data.programId, name: data.programName});
      }
    },

    onProgramStop: function(data)
    {
      this.removeProgram(data._id);

      var zoneView = this.zoneViews[data.zoneId];

      if (zoneView)
      {
        zoneView.programStopped();
      }
    },

    refresh: function()
    {
      window.location.reload();
    }

  });
});
