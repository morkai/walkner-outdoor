var step       = require('step');
var modbus     = require('h5.modbus');
var controller = require('./controller');

controller.run({
  initialize  : initialize,
  finalize    : finalize,
  startZone   : startZone,
  stopZone    : stopZone
});

var master = null;
var zones  = {};

function initialize(connectionInfo, cb)
{
  master = modbus.createMaster({
    type                 : 'tcp',
    host                 : connectionInfo.host,
    port                 : connectionInfo.port,
    autoConnect          : false,
    autoReconnect        : true,
    timeout              : 200,
    maxTimeouts          : 5,
    maxRetries           : 3,
    maxConcurrentRequests: 1
  });

  var reconnects = 0;

  master.on('error', function() {});
  master.on('connect', onConnect);
  master.on('disconnect', onDisconnect);
  master.on('connect', resetReconnects);
  master.on('disconnect', checkLostConnection);

  master.connect();

  function onConnect()
  {
    master.removeListener('connect', onConnect);
    master.removeListener('disconnect', onDisconnect);

    cb(null);
  }

  function onDisconnect()
  {
    master.removeListener('connect', onConnect);
    master.removeListener('disconnect', onDisconnect);

    cb('Nie udało się połączyć ze sterownikiem :(');
  }

  function resetReconnects()
  {
    reconnects = 0;
  }

  function checkLostConnection(reconnect)
  {
    if (reconnect)
    {
      reconnects += 1;
    }

    if (reconnects === 4)
    {
      for (var zoneId in zones)
      {
        var zone = zones[zoneId];

        zone.stopped = true;
        clearTimeout(zone.timeout);

        controller.zoneFinished('Utracono połączenie ze sterownikiem.', zoneId);
      }

      zones               = {};
      master.requestQueue = [];
    }
  }
}

function finalize(cb)
{
  cb(null);
}

function startZone(options, cb)
{
  var zoneId = options.zoneId;

  zones[zoneId] = options;

  setLeds(zoneId, {green: 1, red: 0}, function(err)
  {
    if (!err)
    {
      executeStep(0, 0, zoneId);
    }

    cb(err);
  });
}

function stopZone(zoneId, cb)
{
  var zone = zones[zoneId];

  if (!zone) return cb();

  clearTimeout(zone.timeout);

  zone.stopped = true;

  turnOff(zone, function()
  {
    setLeds(zoneId, {green: 0, red: 0}, function()
    {
      delete zones[zoneId];

      cb();
    });
  });
}

function finishZone(err, zoneId)
{
  setLeds(zoneId, {green: 0, red: err}, function()
  {
    delete zones[zoneId];

    controller.zoneFinished(err, zoneId);
  });
}

function executeStep(stepIndex, stepIteration, zoneId)
{
  var zone = zones[zoneId];

  if (!zone || zone.stopped) return;

  var programStep = zone.steps[stepIndex];

  if (!programStep)
  {
    if (zone.infinite)
    {
      return process.nextTick(function() { executeStep(0, 0, zoneId); });
    }

    return process.nextTick(function()
    {
      finishZone(null, zoneId);
    });
  }

  if (programStep.iterations === stepIteration)
  {
    return process.nextTick(function()
    {
      executeStep(stepIndex + 1, 0, zoneId);
    });
  }

  step(
    function turnOnStep()
    {
      var next      = this;
      var startTime = Date.now();

      turnOn(zone, function(err)
      {
        if (err) return next(err);

        var timeOn = (programStep.timeOn * 1000) - (Date.now() - startTime);

        zone.timeout = setTimeout(next, timeOn);
      });
    },
    function turnOffStep(err)
    {
      if (zone.stopped) return this();

      if (err) throw err;

      var next      = this;
      var startTime = Date.now();

      turnOff(zone, function(err)
      {
        if (err) return next(err);

        var timeOff = (programStep.timeOff * 1000) - (Date.now() - startTime);

        zone.timeout = setTimeout(next, timeOff);
      });
    },
    function nextIterationStep(err)
    {
      if (zone.stopped) return;

      if (err)
      {
        process.nextTick(function() { finishZone(err, zoneId); });
      }
      else
      {
        process.nextTick(function()
        {
          executeStep(stepIndex, stepIteration + 1, zoneId);
        });
      }
    }
  );
}

function turnOn(zone, handler)
{
  master.executeRequest({
    fn     : 5,
    unit   : zone.controllerInfo.stateUnit,
    address: zone.controllerInfo.stateOutput,
    value  : true,
    handler: handler
  });
}

function turnOff(zone, handler)
{
  master.executeRequest({
    fn     : 5,
    unit   : zone.controllerInfo.stateUnit,
    address: zone.controllerInfo.stateOutput,
    value  : false,
    handler: handler
  });
}

function setLeds(zoneId, leds, cb)
{
  var zone = zones[zoneId];

  if (!zone) return;

  step(
    function setGreenLedStep()
    {
      var next = this;

      if (!leds.hasOwnProperty('green'))
      {
        next();
      }

      master.executeRequest({
        fn     : 5,
        unit   : zone.controllerInfo.greenLedUnit,
        address: zone.controllerInfo.greenLedOutput,
        value  : leds.green ? true : false,
        handler: next
      });
    },
    function setRedLedStep(err)
    {
      var next = this;

      if (err)
      {
        return next('Nie udało się ustawić zielonej lampy.');
      }

      if (!leds.hasOwnProperty('red'))
      {
        next();
      }

      master.executeRequest({
        fn     : 5,
        unit   : zone.controllerInfo.redLedUnit,
        address: zone.controllerInfo.redLedOutput,
        value  : leds.red ? true : false,
        handler: next
      });
    },
    function checkErrorStep(err)
    {
      if (err && err instanceof Error)
      {
        err = 'Nie udało się ustawić czerwonej lampy.';
      }

      return cb(err);
    }
  );
}