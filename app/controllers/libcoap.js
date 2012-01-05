require('../utils/logging');

var exec       = require('child_process').exec;
var step       = require('step');
var controller = require('./controller');

controller.run({
  initialize  : initialize,
  finalize    : finalize,
  startZone   : startZone,
  stopZone    : stopZone
});

var config = require(__dirname + '/../../config/libcoap');

var uri   = '';
var zones = {};

function initialize(connectionInfo, cb)
{
  uri = connectionInfo.uri;

  if (uri[uri.length - 1] === '/')
  {
    uri = uri.substring(0, uri.length);
  }

  getResource('/helloworld', function(err)
  {
    cb(err ? 'Nie udało się połączyć ze sterownikiem :(' : null);
  });
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
  setResource(zone.controllerInfo.stateResource || '/io/state', true, handler);
}

function turnOff(zone, handler)
{
  setResource(zone.controllerInfo.stateResource || '/io/state', false, handler);
}

function setLeds(zoneId, leds, cb)
{
  var zone = zones[zoneId];

  if (!zone) return cb(null);

  step(
    function setGreenLedStep()
    {
      var next = this;

      if (!leds.hasOwnProperty('green'))
      {
        next();
      }

      setResource(
        zone.controllerInfo.greenLedResource || '/io/greenLed',
        leds.green,
        next
      );
    },
    function setGreenLedStep(err)
    {
      if (err) throw 'Nie udało się ustawić zielonej lampy :(';

      var next = this;

      if (!leds.hasOwnProperty('red'))
      {
        next();
      }

      setResource(
        zone.controllerInfo.greenLedResource || '/io/redLed',
        leds.red,
        next
      );
    },
    function checkErrorStep(err)
    {
      if (err && typeof err.message === 'string')
      {
        err = 'Nie udało się ustawić czerwonej lampy :(';
      }

      cb(err);
    }
  );
}

function getResource(resource, cb)
{
  var cmd = config.coapClientPath + ' ' + uri;

  if (resource[0] !== '/')
  {
    cmd += '/';
  }

  cmd += resource;

  execCmd(cmd, cb);
}

function setResource(resource, state, cb)
{
  var stateFile = config.stateFilesDir + '/' + (state ? 'one' : 'zero') + '.bin';

  var cmd = config.coapClientPath + ' -m put -f ' + stateFile + ' ' + uri;

  if (resource[0] !== '/')
  {
    cmd += '/';
  }

  cmd += resource;

  execCmd(cmd, cb);
}

function execCmd(cmd, cb, count)
{
  if (!count)
  {
    count = 0;

    console.debug('Exec coap-client request: %s', cmd);
  }
  else
  {
    console.debug('<%d> retry of coap-client request: %s', count, cmd);
  }

  exec(cmd, function(err)
  {
    count += 1;

    if (err && count <= config.maxRetries)
    {
      process.nextTick(function()
      {
        execCmd(cmd, cb, count);
      });
    }
    else
    {
      return cb(err);
    }
  })
}