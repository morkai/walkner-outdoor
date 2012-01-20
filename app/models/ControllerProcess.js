var fork = require('child_process').fork;
var _    = require('underscore');
var step = require('step');

var messageHandlers = {};

var ControllerProcess = function(controller)
{
  this.requests   = {};
  this.zones      = {};
  this.controller = {
    startTime     : Date.now(),
    name          : controller.name,
    type          : controller.type,
    connectionInfo: controller.connectionInfo
  };

  this.setUpChildProcess();
};

_.extend(ControllerProcess.prototype, {

  startController: function(done)
  {
    this.sendMessage('startController', this.controller.connectionInfo, done);
  },

  stopController: function(done)
  {
    var self = this;

    this.sendMessage('stopController', function(err)
    {
      if (!err)
      {
        self.destroy();
      }

      done(err);
    });
  },

  startZone: function(zone, done)
  {
    if (zone.id in this.zones)
    {
      return done();
    }

    var self = this;
    var data = {
      id            : zone.id,
      name          : zone.name,
      controllerInfo: zone.controllerInfo
    };

    this.sendMessage('startZone', data, function(err)
    {
      if (err)
      {
        return done(err);
      }

      self.zones[zone.id] = _.extend({}, data, {
        startTime      : Date.now(),
        program        : null,
        onProgramFinish: null
      });

      done();
    });
  },

  stopZone: function(zoneId, done)
  {
    var zone = this.zones[zoneId];

    if (!zone)
    {
      return done();
    }

    if (zone.running)
    {
      zone.stopProgram(zoneId, function(err)
      {
        if (err)
        {
          done(err);
        }
        else
        {
          stopZone();
        }
      });
    }
    else
    {
      stopZone();
    }

    var self = this;

    function stopZone()
    {
      self.sendMessage('stopZone', zoneId, function(err)
      {
        if (err)
        {
          done(err);
        }
        else
        {
          delete self.zones[zoneId];

          done();
        }
      });
    }
  },

  startProgram: function(program, zoneId, user, onFinish, done)
  {
    var zone = this.zones[zoneId];

    if (!zone)
    {
      return done('Invalid controller process for the specified zone.');
    }

    if (zone.program)
    {
      return done('A program is already running on the specified zone.');
    }

    var data = {
      zoneId : zoneId,
      user   : user,
      program: {
        id      : program.id,
        name    : program.name,
        steps   : program.steps,
        infinite: program.infinite
      }
    };

    this.sendMessage('startProgram', data, function(err)
    {
      if (err)
      {
        return done(err);
      }

      zone.program         = data.program;
      zone.onProgramFinish = onFinish;

      done();
    });
  },

  stopProgram: function(zoneId, done)
  {
    var zone = this.zones[zoneId];

    if (!zone || !zone.program)
    {
      return done();
    }

    this.sendMessage('stopProgram', zoneId, function(err)
    {
      if (err)
      {
        return done(err);
      }

      zone.program         = null;
      zone.onProgramFinish = null;

      done();
    });
  },

  blinkRedLed: function(zoneId, time)
  {
    this.sendMessage('blinkRedLed', {zoneId: zoneId, time: time || 1});
  },

  /**
   * @private
   */
  destroy: function()
  {
    this.childProcess.removeAllListeners();
    this.childProcess.kill();

    this.childProcess = null;
    this.requests     = null;
    this.zones        = null;
    this.controller   = null;
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
      res  = data;
      data = undefined;
    }

    var message   = {
      id  : _.uniqueId('REQ-'),
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
    var controllerType = this.controller.type;

    var file      = __dirname + '/../controllers/' + controllerType + '.js';
    var arguments = [];
    var options   = {cwd: process.cwd(), env: process.env};

    var childProcess = fork(file, arguments, options);

    childProcess.on('exit', this.onChildProcessExit.bind(this));
    childProcess.on('message', this.onChildProcessMessage.bind(this));

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

    var self  = this;
    var zones = this.zones;

    for (var zoneId in zones)
    {
      var zone = zones[zoneId];

      if (!zone.program)
      {
        continue;
      }

      messageHandlers.programFinished.call(this, {
        zoneId      : zone.id,
        zoneName    : zone.name,
        programName : zone.program.name,
        finishedAt  : new Date(),
        finishState : 'error',
        errorMessage: 'Zamknięcie procesu sterownika.'
      });
    }

    this.zones = {};

    step(
      function restartControllerStep()
      {
        self.setUpChildProcess();
        self.startController(this);
      },
      function restartZonesStep()
      {
        var group = this.group();

        for (var zoneId in zones)
        {
          self.startZone(zones[zoneId], group());
        }
      },
      function debugStep()
      {
        console.debug(
          'Restarted controller <%s>!', self.controller.name
        );
      }
    )
  },

  /**
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
  }

});

_.extend(messageHandlers, {

  programFinished: function(data)
  {
    var zone = this.zones[data.zoneId];

    if (!zone || !zone.program)
    {
      return;
    }

    if (_.isFunction(zone.onProgramFinish))
    {
      zone.onProgramFinish(data);
    }

    zone.program         = null;
    zone.onProgramFinish = null;
  },

  startAssignedProgram: function(data)
  {
    var zoneId = data.zoneId;
    var zone   = this.zones[zoneId];

    if (!zone)
    {
      return console.error(
        'Requested zone <%s> is not running on controller <%s>.',
        zoneId,
        this.controller.name
      );
    }

    if (zone.program)
    {
      console.error(
        'Requested zone <%s> is already running program <%s>.',
        zone.name,
        zone.program.name
      );

      return self.blinkRedLed(zoneId);
    }

    var self = this;

    app.db.model('Zone').findById(zoneId, function(err, zone)
    {
      if (err)
      {
        return self.blinkRedLed(zoneId);
      }

      if (!zone)
      {
        return self.stopZone(zoneId, function() {});
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

          return self.blinkRedLed(zoneId);
        }
      });
    });
  }

});

module.exports = ControllerProcess;
