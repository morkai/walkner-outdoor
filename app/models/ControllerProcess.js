var fork = require('child_process').fork;
var _ = require('underscore');
var step = require('step');
var ObjectId = require('mongoose').SchemaTypes.ObjectId;
var ActiveZone = require('./ActiveZone');

var messageHandlers = {};

var ControllerProcess = function(controller)
{
  _.bindAll(
    this, 'onChildProcessExit', 'onChildProcessMessage', 'onZoneProgram'
  );

  this.requests = {};
  this.zones = {};
  this.controller = {
    startTime: Date.now(),
    _id: controller._id,
    name: controller.name,
    type: controller.type,
    connectionInfo: controller.connectionInfo
  };
  this.isConnected = false;

  this.setUpChildProcess();
};

_.extend(ControllerProcess.prototype, {

  /**
   * @param {Function} done
   */
  startController: function(done)
  {
    var controller = this.controller;
    var data = {
      _id: controller._id,
      name: controller.name,
      connectionInfo: controller.connectionInfo
    };

    this.sendMessage('startController', data, function(err)
    {
      if (!err)
      {
        app.io.sockets.emit('controller started', controller._id);
      }

      done(err);
    });
  },

  /**
   * @param {Function} done
   */
  stopController: function(done)
  {
    var self = this;

    this.sendMessage('stopController', function(err)
    {
      if (!err)
      {
        var controllerId = self.controller._id;

        self.destroy();

        app.io.sockets.emit('controller stopped', controllerId);
      }

      done(err);
    });
  },

  /**
   * @param {Zone|Object} zone
   * @param {Function} done
   */
  startZone: function(zone, done)
  {
    if (zone._id in this.zones)
    {
      return done();
    }

    var controllerProcess = this;
    var data = zone.toJSON ? zone.toJSON() : zone;

    this.sendMessage('startZone', data, function(err)
    {
      if (err)
      {
        return done(err);
      }

      var activeZone = new ActiveZone(
        zone,
        controllerProcess.isConnected ? 'connected' : 'disconnected',
        done
      );

      activeZone.on('programmed', controllerProcess.onZoneProgram);

      controllerProcess.zones[zone._id] = activeZone;
    });
  },

  /**
   * @param {String} zoneId
   * @param {Function} done
   */
  stopZone: function(zoneId, done)
  {
    var zones = this.zones;
    var activeZone = zones[zoneId];

    if (!activeZone)
    {
      return done();
    }

    this.sendMessage('stopZone', zoneId, function(err)
    {
      if (err)
      {
        done(err);
      }
      else
      {
        activeZone.destroy();

        delete zones[zoneId];

        done();
      }
    });
  },

  /**
   * @param {String} zoneId
   * @param {Function} done
   */
  resetZone: function(zoneId, done)
  {
    var activeZone = this.zones[zoneId];

    if (!activeZone)
    {
      return done();
    }

    this.sendMessage('resetZone', zoneId, done);
  },

  /**
   * @param {Program} program
   * @param {String} zoneId
   * @param {?Object} user
   * @param {?Function} onFinish
   * @param {Function} done
   */
  startProgram: function(program, zoneId, user, done)
  {
    var zone = this.zones[zoneId];

    if (!zone)
    {
      return done('Invalid controller process for the specified zone.');
    }

    var data = {
      zoneId: zoneId,
      user: user,
      program: program.toObject()
    };

    this.sendMessage('startProgram', data, function(err)
    {
      if (err)
      {
        return done(err);
      }

      zone.programRunning(program, user);

      done(null, zone.historyEntry);
    });
  },

  /**
   * @param {String} zoneId
   * @param {?Object} user
   * @param {Function} done
   */
  stopProgram: function(zoneId, user, done)
  {
    var zone = this.zones[zoneId];

    if (!zone)
    {
      return done();
    }

    this.sendMessage('stopProgram', zoneId, function(err)
    {
      if (err)
      {
        return done(err);
      }

      zone.programStopped(user);

      done();
    });
  },

  /**
   * @private
   */
  destroy: function()
  {
    this.childProcess.removeAllListeners();
    this.childProcess.kill();

    this.childProcess = null;
    this.requests = null;
    this.zones = null;
    this.controller = null;
  },

  /**
   * @private
   * @param {String} type
   * @param {?Object} data
   * @param {?Function} res
   */
  sendMessage: function(type, data, res)
  {
    if (typeof data === 'function')
    {
      res = data;
      data = undefined;
    }

    var message = {
      id: _.uniqueId('REQ-'),
      type: type,
      data: data
    };

    this.childProcess.send(message);

    if (res)
    {
      this.requests[message.id] = res;
    }
  },

  /**
   * @private
   */
  setUpChildProcess: function()
  {
    var file = __dirname + '/../controllers/process.js';
    var arguments = [this.controller.type];
    var options = {cwd: process.cwd(), env: process.env};

    var childProcess = fork(file, arguments, options);

    childProcess.on('exit', this.onChildProcessExit);
    childProcess.on('message', this.onChildProcessMessage);

    this.childProcess = childProcess;
  },

  /**
   * @private
   * @param {Number} code
   */
  onChildProcessExit: function(code)
  {
    if (!code)
    {
      return;
    }

    console.debug('Controller <%s> crashed :(', this.controller.name);

    var activeZones = this.zones;

    for (var zoneId in activeZones)
    {
      var activeZone = activeZones[zoneId];

      if (activeZone.state === 'programRunning')
      {
        activeZone.programErrored('Zamknięcie procesu sterownika.');
      }

      app.io.sockets.emit('zone stopped', activeZone.zone._id);

      activeZone.destroy();
    }

    this.zones = {};

    var controllerProcess = this;

    step(
      function restartControllerStep()
      {
        controllerProcess.setUpChildProcess();
        controllerProcess.startController(this);
      },
      function restartZonesStep(err)
      {
        if (err)
        {
          throw err;
        }

        var group = this.group();

        for (var zoneId in activeZones)
        {
          controllerProcess.startZone(activeZones[zoneId].zone, group());
        }
      },
      function checkErrorStep(err)
      {
        if (err)
        {
          console.error(
            "Couldn't restart controller <%s>: %s",
            controllerProcess.controller.name,
            err.stack ? err.stack : err
          );

          var controllerId = controllerProcess.controller._id;

          controllerProcess.destroy();

          if (controllerProcess.onCrash)
          {
            controllerProcess.onCrash(controllerId);
          }

          app.io.sockets.emit(
            'controller stopped', controllerId
          );
        }
        else
        {
          console.debug(
            'Restarted controller <%s>!', controllerProcess.controller.name
          );
        }
      }
    )
  },

  /**
   * @private
   * @param {Object} message
   */
  onChildProcessMessage: function(message)
  {
    var id = message.id;

    if (id && id in this.requests)
    {
      var res = this.requests[id];

      delete this.requests[id];

      return res(message.error, message.data);
    }

    var type = message.type;

    if (type in messageHandlers)
    {
      return messageHandlers[type].call(this, message.data);
    }
  },

  /**
   * @private
   * @param {String} zoneId
   * @param {?Object} assignedProgram
   */
  onZoneProgram: function(zoneId, assignedProgram)
  {
    this.sendMessage('programZone', {
      zoneId: zoneId,
      assignedProgram: assignedProgram
    });
  }

});

_.extend(messageHandlers, {

  /**
   * @param {Object} [data]
   */
  connected: function(data)
  {
    this.isConnected = true;

    if (data && data.zoneId)
    {
      var zone = this.zones[data.zoneId];

      if (zone)
      {
        zone.connected(false);
      }
    }
    else
    {
      _.each(this.zones, function(zone)
      {
        zone.connected(true);
      });
    }
  },

  disconnected: function()
  {
    this.isConnected = false;

    _.each(this.zones, function(zone)
    {
      zone.disconnected();
    });
  },

  zoneStarted: function(zoneId)
  {
    var activeZone = this.zones[zoneId];

    if (!activeZone)
    {
      return;
    }

    if (_.isObject(activeZone.zone.program) && !activeZone.zone.program._id)
    {
      activeZone.once('programmed', function()
      {
        app.io.sockets.emit('zone started', activeZone);
      });
    }
    else
    {
      app.io.sockets.emit('zone started', activeZone);
    }
  },

  zoneStopped: function(zoneId)
  {
    app.io.sockets.emit('zone stopped', zoneId);
  },

  /**
   * @param {Object} data
   * @param {String} data.zoneId
   */
  zoneNeedsReset: function(data)
  {
    var zone = this.zones[data.zoneId];

    if (!zone)
    {
      return;
    }

    zone.needsReset();
  },

  /**
   * @param {Object} data
   * @param {String} data.zoneId
   */
  zoneWasReset: function(data)
  {
    var zone = this.zones[data.zoneId];

    if (!zone)
    {
      return;
    }

    zone.wasReset();
  },

  /**
   * @param {Object} data
   * @param {String} data.zoneId
   */
  zoneNeedsPlugIn: function(data)
  {
    var zone = this.zones[data.zoneId];

    if (!zone)
    {
      return;
    }

    zone.needsPlugIn();
  },

  /**
   * @param {Object} data
   * @param {String} data.zoneId
   */
  zoneWasPlugIn: function(data)
  {
    var zone = this.zones[data.zoneId];

    if (!zone)
    {
      return;
    }

    zone.wasPlugIn();
  },

  /**
   * @param {Object} data
   * @param {String} data.zoneId
   * @param {Object} data.remoteState
   */
  remoteProgramRunning: function(data)
  {
    var zone = this.zones[data.zoneId];

    if (zone)
    {
      zone.remoteProgramRunning(data.remoteState);
    }
  },

  /**
   * @param {Object} data
   * @param {String} data.zoneId
   * @param {Boolean} data.remote
   */
  programFinished: function(data)
  {
    var zone = this.zones[data.zoneId];

    if (zone)
    {
      zone.programFinished(data.remote);
    }
  },

  /**
   * @param {Object} data
   * @param {String} data.zoneId
   * @param {String} data.errorMessage
   */
  programErrored: function(data)
  {
    var zone = this.zones[data.zoneId];

    if (zone)
    {
      zone.programErrored(data.errorMessage, data.programId);
    }
  },

  /**
   * @param {Object} data
   * @param {String} data.zoneId
   */
  programStopped: function(data)
  {
    var zone = this.zones[data.zoneId];

    if (zone)
    {
      zone.programStopped(null, data.programId);
    }
  },

  updateProgress: function(data)
  {
    var zone = this.zones[data.zoneId];

    if (zone)
    {
      delete data.zoneId;

      zone.updateProgress(data);
    }
  },

  startAssignedProgram: function(data)
  {
    var zoneId = data.zoneId;
    var activeZone = this.zones[zoneId];

    if (!activeZone)
    {
      return console.error(
        'Requested zone <%s> is not running on controller <%s>.',
        zoneId,
        this.controller.name
      );
    }

    var controllerProcess = this;

    app.db.model('Zone').findById(zoneId, function(err, zone)
    {
      if (err)
      {
        throw err;
      }

      if (!zone)
      {
        return controllerProcess.stopZone(zoneId, function() {});
      }

      zone.startProgram(zone.program, null, function(err)
      {
        if (err)
        {
          console.error(
            "Couldn't start the requested program <%s> on zone <%s>: %s",
            zone.program,
            zone.name,
            err.message || err
          );
        }
      });
    });
  },

  timed: function(results)
  {
    app.io.sockets.emit('controller timed', {
      controllerId: this.controller._id,
      results: results
    });
  },

  markProgramAsInterrupted: function(data)
  {
    var zone = this.zones[data.zoneId];

    if (zone)
    {
      zone.markProgramAsInterrupted(data.programId, data.interruptTime);
    }
  }

});

module.exports = ControllerProcess;
