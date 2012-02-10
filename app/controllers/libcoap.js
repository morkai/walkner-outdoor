require('../utils/logging');

var exec       = require('child_process').exec;
var step       = require('step');
var controller = require('./controller');

var config = require(__dirname + '/../../config/libcoap');

var uri = '';

var defaultResources = {
  stateResource     : '/io/state',
  greenLedResource  : '/io/greenLed',
  redLedResource    : '/io/redLed',
  stopButtonResource: '/io/stopBut'
};

controller.run({

  initialize: function(connectionInfo, done)
  {
    uri = connectionInfo.uri;

    if (uri[uri.length - 1] === '/')
    {
      uri = uri.substring(0, uri.length - 1);
    }

    done();
  },

  finalize: function(done)
  {
    uri = null;

    done();
  },

  setState: function(state, zone, done)
  {
    var stateResource = zone.controllerInfo.stateResource ||
                        defaultResources.stateResource;

    setResource(stateResource, state, done);
  },

  setLeds: function(leds, zone, done)
  {
    step(
      function setGreenLedStep()
      {
        var next = this;

        if (!leds.hasOwnProperty('green'))
        {
          return next();
        }

        var greenLedResource = zone.controllerInfo.greenLedResource ||
                               defaultResources.greenLedResource;

        setResource(greenLedResource, leds.green, next);
      },
      function setRedLedStep(err)
      {
        if (err) throw 'Nie udało się ustawić zielonej lampy :(';

        var next = this;

        if (!leds.hasOwnProperty('red'))
        {
          return next();
        }

        var redLedResource = zone.controllerInfo.redLedResource ||
                             defaultResources.redLedResource;

        setResource(redLedResource, leds.red, next);
      },
      function checkErrorStep(err)
      {
        if (err && typeof err.message === 'string')
        {
          err = 'Nie udało się ustawić czerwonej lampy :(';
        }

        done(err);
      }
    );
  },

  getInput: function(input, zone, done)
  {
    var inputResource = zone.controllerInfo[input + 'Resource'] ||
                        defaultResources[input + 'Resource'];

    if (!inputResource)
    {
      return done('Unknown input: ' + input);
    }

    getResource(inputResource, function(err, stdout)
    {
      if (err)
      {
        return done(err);
      }

      var matches = stdout.match(/data:'\\x0([0-9])'/);

      if (matches)
      {
        done(null, parseInt(matches[1]));
      }
      else
      {
        done("Couldn't find data in the response.");
      }
    });
  }

});

function getResourceUri(resource)
{
  return uri + (resource[0] !== '/' ? '/' : '') + resource;
}

function getResource(resource, cb)
{
  var cmd = config.coapClientPath + ' ' + getResourceUri(resource);

  execCmd(cmd, cb);
}

function setResource(resource, state, cb)
{
  var stateFile = config.stateFilesDir + '/' + (state ? 'one' : 'zero')
                + '.bin';
  var cmd       = config.coapClientPath + ' -m put -f ' + stateFile + ' '
                + getResourceUri(resource);

  execCmd(cmd, cb);
}

function execCmd(cmd, cb, count, startTime)
{
  if (typeof count === 'undefined')
  {
    count = 0;
  }

  if (typeof startTime === 'undefined')
  {
    startTime = Date.now();
  }

  exec(cmd, function(err, stdout)
  {
    count += 1;

    if (err && count <= config.maxRetries)
    {
      process.nextTick(function()
      {
        execCmd(cmd, cb, count, startTime);
      });
    }
    else
    {
      controller.requestTimed(Date.now() - startTime);

      return cb(err, stdout);
    }
  });
}
