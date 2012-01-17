var fork = require('child_process').fork;
var _    = require('underscore');

var messageHandlers = {};

var ControllerProcess = function(controller)
{
  this.setUpChildProcess(controller.type);

  this.requests       = {};
  this.connectionInfo = controller.connectionInfo;
  this.zones          = {};
};

_.extend(ControllerProcess.prototype, {

  startController: function(done)
  {
    this.sendMessage('startController', this.connectionInfo, done);
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

      self.zones[zone.id] = {
        running: false
      };

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

  startProgram: function(program, zoneId, onFinish, done)
  {
    var zone = this.zones[zoneId];

    if (!zone)
    {
      return done('Invalid controller process for the specified zone.');
    }

    if (zone.programRunning)
    {
      return done('A program is already running on the specified zone.');
    }

    var data = {
      zoneId : zoneId,
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

      zone.programRunning  = true;
      zone.onProgramFinish = onFinish;

      done();
    });
  },

  stopProgram: function(zoneId, done)
  {
    var zone = this.zones[zoneId];

    if (!zone || !zone.programRunning)
    {
      return done();
    }

    this.sendMessage('stopProgram', zoneId, function(err)
    {
      if (err)
      {
        return done(err);
      }

      zone.programRunning = false;

      if (_.isFunction(zone.onProgramFinish))
      {
        delete zone.onProgramFinish;
      }

      done();
    });
  },

  /**
   * @private
   */
  destroy: function()
  {
    this.process.removeAllListeners();
    this.process.kill();

    delete this.process;
    delete this.requests;
    delete this.connectionInfo;
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
   * @param {String} controllerType
   */
  setUpChildProcess: function(controllerType)
  {
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
    console.error('Controller process crashed?!');
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

    if (!zone || !zone.programRunning)
    {
      return;
    }

    if (_.isFunction(zone.onProgramFinish))
    {
      zone.onProgramFinish(data);

      delete zone.onProgramFinish;
    }

    zone.programRunning = false;
  }

});

module.exports = ControllerProcess;
