define(
[
  'jQuery',
  'Underscore',
  'Backbone',
  'moment',

  'app/time',
  'app/socket',
  'app/views/viewport',
  'app/views/PageLayout',
  'app/views/diag/ControllerDiagView',
  'app/views/diag/ZoneDiagView',
  'app/views/diag/ProgramDiagView',
  'app/views/diag/BackupFileView',
  'app/views/diag/GraphView',

  'text!app/templates/diag/diag.html'
],
/**
 * @param {jQuery} $
 * @param {Underscore} _
 * @param {Backbone} Backbone
 * @param {moment} moment
 * @param {Object} time
 * @param {io.SocketNamespace} socket
 * @param {Viewport} viewport
 * @param {function(new:PageLayout)} PageLayout
 * @param {function(new:ControllerDiagView)} ControllerDiagView
 * @param {function(new:ZoneDiagView)} ZoneDiagView
 * @param {function(new:ProgramDiagView)} ProgramDiagView
 * @param {function(new:BackupFileView)} BackupFileView
 * @param {function(new:GraphView)} GraphView
 * @param {String} diagTpl
 */
function(
  $,
  _,
  Backbone,
  moment,
  time,
  socket,
  viewport,
  PageLayout,
  ControllerDiagView,
  ZoneDiagView,
  ProgramDiagView,
  BackupFileView,
  GraphView,
  diagTpl)
{
  /**
   * @class DiagView
   * @constructor
   * @extends Backbone.View
   * @param {Object} [options]
   */
  var DiagView = Backbone.View.extend({
    helpHash: 'diag',
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
      'reconnect': 'refresh',
      'backup created': 'onBackupFileCreate',
      'backup removed': 'onBackupFileRemove'
    },
    events: {
      'click .createBackup': 'onCreateBackupClick',
      'click .removeBackups': 'onRemoveBackupsClick'
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
    this.backupViews = {};
    this.graphView = null;

    this.uptimeTimer = null;
  };

  DiagView.prototype.destroy = function()
  {
    clearTimeout(this.uptimeTimer);

    for (var topic in this.topics)
    {
      socket.removeListener(topic, this[this.topics[topic]]);
    }

    _.destruct(this, 'controllerViews', 'zoneViews', 'programViews', 'backupViews', 'graphView');

    this.remove();

    this.controllerViews = null;
    this.zoneViews = null;
    this.programViews = null;
    this.backupViews = null;
    this.graphView = null;
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

    this.renderBackups();
    this.renderControllers();
    this.renderZones();
    this.renderPrograms();
    this.renderGraph();

    this.updateUptime();

    return this;
  };

  /**
   * @private
   */
  DiagView.prototype.renderGraph = function()
  {
    this.graphView = new GraphView({model: this.model});
    this.graphView.render();

    $(this.el).append(this.graphView.el);
  };

  /**
   * @private
   */
  DiagView.prototype.renderBackups = function()
  {
    var diagView = this;

    _.each(this.model.backups, function(backupFile)
    {
      diagView.addBackupFile(backupFile, false);
    });
  };

  /**
   * @private
   */
  DiagView.prototype.renderControllers = function()
  {
    var controllers = this.model.controllers;

    if (controllers.length === 0)
    {
      this.$('.controllers').hide();

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
      this.$('.zones').hide();

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
      this.$('.programs').hide();

      return;
    }

    this.$('.noProgramsMessage').hide();

    _.each(programs, this.addProgram, this);
  };

  /**
   * @private
   * @param {Object} backupFile
   * @param {Boolean=} prepend
   */
  DiagView.prototype.addBackupFile = function(backupFile, prepend)
  {
    var backupFileView = new BackupFileView({model: backupFile});
    var $backups = this.$('.backups tbody');
    var $backup = $(backupFileView.render().el);

    if (prepend === true)
    {
      $backups.prepend($backup).hide().fadeIn();
    }
    else
    {
      $backups.append($backup);
    }

    this.backupViews[backupFile.id] = backupFileView;
  };

  /**
   * @private
   * @param {String} id
   */
  DiagView.prototype.removeBackupFile = function(id)
  {
    var backupFileView = this.backupViews[id];

    if (!backupFileView)
    {
      return;
    }

    delete this.backupViews[id];

    backupFileView.destroy();
  };

  /**
   * @private
   * @param {Object} controller
   */
  DiagView.prototype.addController = function(controller)
  {
    var controllerView = new ControllerDiagView({model: controller});

    this.$('.noControllersMessage').hide();
    this.$('.controllers tbody').append(controllerView.render().el);
    this.$('.controllers').show();

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

      if (controller)
      {
        zone.controller = {
          _id: controller._id,
          name: controller.name
        };
      }
      else
      {
        zone.controller = null;
      }
    }

    var zoneView = new ZoneDiagView({model: zone});

    this.$('.noZonesMessage').hide();
    this.$('.zones tbody').append(zoneView.render().el);
    this.$('.zones').show();

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

    var zoneView = this.zoneViews[data._id];

    zoneView.model.state = data.state;

    if (data.state === 'programRunning')
    {
      this.addProgram({
        _id: data.historyEntry,
        zoneId: data._id,
        zoneName: zoneView.model.name,
        programId: data.program._id,
        programName: data.program.name,
        startUserId: data.program.startUser
          ? data.program.startUser._id : null,
        startUserName: data.program.startUser
          ? data.program.startUser.name : null,
        startTime: data.program.startTime
      });

      zoneView.programStarted(data.program);
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

      zoneView.programStopped();
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
    this.$('.programs tbody').append(programView.render().el);
    this.$('.programs').show();

    this.programViews[historyEntry._id] = programView;
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
      this.$('.programs').hide();
    }
  };

  /**
   * @private
   */
  DiagView.prototype.updateUptime = function()
  {
    var now = Date.now() - time.offset;

    this.$('[data-property="uptime"]').each(function()
    {
      var $el = $(this);
      var startTime = parseInt($el.attr('data-startTime'));

      if (startTime === 0)
      {
        $el.text('-');
      }
      else
      {
        $el.text(time.toString((now - startTime) / 1000));
      }
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

    zoneView.model.state = data.state;

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

    zoneView.model.state = null;

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
  };

  /**
   * @private
   * @param {Object} backupFile
   */
  DiagView.prototype.onBackupFileCreate = function(backupFile)
  {
    this.addBackupFile(backupFile, true);
  };

  /**
   * @private
   * @param {String|Array.<String>} backupFileIds
   */
  DiagView.prototype.onBackupFileRemove = function(backupFileIds)
  {
    if (_.isArray(backupFileIds))
    {
      var diagView = this;

      backupFileIds.forEach(function(backupFileId)
      {
        diagView.removeBackupFile(backupFileId);
      });
    }
    else
    {
      this.removeBackupFile(backupFileIds);
    }
  };

  /**
   * @private
   */
  DiagView.prototype.onCreateBackupClick = function(e)
  {
    var $action = $(e.target);

    $action.attr('disabled', true);

    $.ajax({
      type: 'POST',
      url: '/diag/backups',
      success: function()
      {
        viewport.msg.show({
          type: 'success',
          time: 2000,
          text: 'Nowa kopia zapasowa bazy danych została stworzona :)'
        });
      },
      error: function()
      {
        viewport.msg.show({
          type: 'error',
          time: 3000,
          text: 'Nie udało się stworzyć kopii zapasowej bazy danych :('
        });
      },
      complete: function()
      {
        $action.removeAttr('disabled');
      }
    });
  };

  /**
   * @private
   */
  DiagView.prototype.onRemoveBackupsClick = function(e)
  {
    var $action = $(e.target);

    $action.attr('disabled', true);

    $.ajax({
      type: 'DELETE',
      url: '/diag/backups',
      success: function()
      {
        viewport.msg.show({
          type: 'success',
          time: 2000,
          text: 'Starych kopie zapasowe bazy danych zostały usunięte :)'
        });
      },
      error: function()
      {
        viewport.msg.show({
          type: 'error',
          time: 3000,
          text: 'Nie udało się usunąć starych kopii zapasowych bazy danych :('
        });
      },
      complete: function()
      {
        $action.removeAttr('disabled');
      }
    });
  };

  return DiagView;
});
