var util = require('util');
var _ = require('underscore');
var step = require('step');
var Zone = require('./Zone');

const REQUEST_TIMES_SEND_INTERVAL = 2000;

/**
 * @constructor
 */
function Controller(process)
{
  this.controller = null;
  this.zones = {};
  this.timers = {};
  this.isConnected = false;
  this.requestTimes = {
    total: 0,
    count: 0,
    last: 0,
    min: Number.MAX_VALUE,
    max: Number.MIN_VALUE
  };

  this.setUpProcess(process);

  this.sendRequestTimes = this.sendRequestTimes.bind(this);
}

Controller.LED_STATE_VALUES = {
  green: {'true': 1, 'false': 0},
  red: {'true': 0, 'false': 1}
};

Controller.INPUT_STATE_VALUES = {
  stopButton: {'true': 1, 'false': 0},
  connected: {'true': 0, 'false': 1}
};

/**
 * @param {String} type
 * @param {Object} [data]
 */
Controller.prototype.sendMessage = function(type, data)
{
  this.process.send({
    type: type,
    data: data
  });
};

/**
 * @param {Object} controller
 * @param {Function} done
 */
Controller.prototype.startController = function(controller, done)
{
  this.controller = controller;

  var self = this;

  this.initialize(function(err)
  {
    if (err)
    {
      self.controller = null;
    }

    done(err);
  });
};

/**
 * @param {Function} done
 */
Controller.prototype.stopController = function(done)
{
  var controller = this;

  step(
    function stopZonesStep()
    {
      if (_.size(controller.zones) === 0)
      {
        return true;
      }

      var group = this.group();

      _.each(controller.zones, function(zone, zoneId)
      {
        zone.finalize('Zatrzymanie procesu sterownika.', group());

        controller.sendMessage('zoneStopped', zoneId);
      });
    },
    function finalizeControllerStep()
    {
      controller.finalize(this);
    },
    function cleanUpStep()
    {
      _.each(controller.timers, function(timer)
      {
        clearTimeout(timer);
      });
      controller.timers = {};
      controller.controller = null;

      return true;
    },
    done
  );
};

/**
 * @param {Object} zone
 * @return {Zone}
 */
Controller.prototype.createZone = function(zone)
{
  return new Zone(this, zone);
};

/**
 * @param {Object} zone
 * @param {Function} done
 */
Controller.prototype.startZone = function(zone, done)
{
  var controller = this;
  var zoneId = zone._id;

  zone = this.createZone(zone);

  zone.initialize(function(err)
  {
    if (!err)
    {
      controller.zones[zoneId] = zone;
    }

    done(err);

    controller.sendMessage('zoneStarted', zoneId);
  });
};

/**
 * @param {String} zoneId
 * @param {Function} done
 */
Controller.prototype.stopZone = function(zoneId, done)
{
  var zone = this.zones[zoneId];

  if (!zone)
  {
    return done();
  }

  var controller = this;

  zone.finalize('Zatrzymanie strefy.', function(err)
  {
    if (!err)
    {
      delete controller.zones[zoneId];
    }

    done(err);

    controller.sendMessage('zoneStopped', zoneId);
  });
};

/**
 * @param {String} zoneId
 * @param {Function} done
 */
Controller.prototype.resetZone = function(zoneId, done)
{
  var zone = this.zones[zoneId];

  if (!zone)
  {
    return done();
  }

  zone.reset(done);
};

/**
 * @param {Object} data
 * @param {Function} done
 */
Controller.prototype.startProgram = function(data, done)
{
  var zone = this.zones[data.zoneId];

  if (!zone)
  {
    return done(util.format(
      "`%s` is not a valid controller for zone: %s",
      this.controller.name,
      data.zoneId
    ));
  }

  zone.startProgram(data, done);
};

Controller.prototype.stopProgram = function(zoneId, done)
{
  var zone = this.zones[zoneId];

  if (!zone)
  {
    return done();
  }

  zone.stopProgram(done);
};

/**
 * @param {Object} data
 * @param {String} data.zoneId
 * @param {?Object} data.assignedProgram
 * @param {Function} done
 */
Controller.prototype.programZone = function(data, done)
{
  var zone = this.zones[data.zoneId];

  if (!zone)
  {
    return done();
  }

  zone.assignProgram(data.assignedProgram, done);
};

Controller.prototype.connected = function()
{
  this.isConnected = true;

  _.each(this.zones, function(zone)
  {
    zone.changeState('connected');
  });

  this.sendMessage('connected');

  process.nextTick(this.sendRequestTimes);
};

Controller.prototype.disconnected = function()
{
  this.isConnected = false;

  _.each(this.zones, function(zone)
  {
    zone.changeState('disconnected');
  });

  this.sendMessage('disconnected');
};

/**
 * @param {Number} time
 */
Controller.prototype.requestTimed = function(time)
{
  var times = this.requestTimes;

  if (times.total === Number.MAX_VALUE)
  {
    times.total = 0;
    times.count = 0;
  }

  times.total += time;
  times.count += 1;
  times.last = time;

  if (time < times.min)
  {
    times.min = time;
  }

  if (time > times.max)
  {
    times.max = time;
  }
};

/**
 * @param {?Function} done
 */
Controller.prototype.initialize = function(done)
{
  done && done();
};

/**
 * @param {?Function} done
 */
Controller.prototype.finalize = function(done)
{
  done && done();
};

/**
 * @param {Boolean} newState
 * @param {Object} controllerInfo
 * @param {?Function} done
 */
Controller.prototype.setZoneState = function(newState, controllerInfo, done)
{
  done && done(new Error(
    "This controller does not support setting zone state."
  ));
};

/**
 * @param {Object.<String, Boolean>} leds
 * @param {Object} controllerInfo
 * @param {?Function} done
 */
Controller.prototype.setZoneLeds = function(leds, controllerInfo, done)
{
  done && done(new Error(
    "This controller does not support setting zone leds."
  ));
};

/**
 * @param {String} input
 * @param {Object} controllerInfo
 * @param {?Function} done
 */
Controller.prototype.getZoneInput = function(input, controllerInfo, done)
{
  done && done(new Error(
    "This controller does not support getting zone inputs."
  ));
};

var messageHandlers = {
  startController: function(req, res)
  {
    this.startController(req, res);
  },
  stopController: function(req, res)
  {
    this.stopController(res);
  },
  startZone: function(req, res)
  {
    this.startZone(req, res);
  },
  stopZone: function(req, res)
  {
    this.stopZone(req, res);
  },
  resetZone: function(req, res)
  {
    this.resetZone(req, res);
  },
  startProgram: function(req, res)
  {
    this.startProgram(req, res);
  },
  stopProgram: function(req, res)
  {
    this.stopProgram(req, res);
  },
  programZone: function(req, res)
  {
    this.programZone(req, res)
  }
};

/**
 * @private
 * @param {process} process
 */
Controller.prototype.setUpProcess = function(process)
{
  var controller = this;

  process.on('message', function(message)
  {
    if (!_.isObject(message))
    {
      return console.error("Invalid message: %s", message);
    }

    if (!_.isString(message.type))
    {
      return console.error(
        "Message object does not have a required type: %s", message
      );
    }

    var handleMessage = messageHandlers[message.type];

    if (!handleMessage)
    {
      return console.error("Unknown message type: %s", message.type);
    }

    var sendResponse = function(err, data)
    {
      process.send({
        id: message.id,
        type: message.type,
        error: err ? (err.stack || err) : undefined,
        data: data
      });
    };

    try
    {
      handleMessage.call(controller, message.data, sendResponse);
    }
    catch (err)
    {
      sendResponse(err);
    }
  });

  this.process = process;
};

/**
 * @private
 */
Controller.prototype.sendRequestTimes = function()
{
  if (!this.isConnected)
  {
    return;
  }

  var times = this.requestTimes;

  if (times.count > 0)
  {
    this.sendMessage('timed', {
      last: Math.ceil(times.last),
      avg: Math.ceil(times.total / times.count),
      min: Math.ceil(times.min),
      max: Math.ceil(times.max)
    });
  }

  this.timers.requestTimes = setTimeout(
    this.sendRequestTimes, REQUEST_TIMES_SEND_INTERVAL
  );
};

module.exports = Controller;
