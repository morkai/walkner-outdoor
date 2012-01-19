require('../utils/logging');

var exec       = require('child_process').exec;
var step       = require('step');
var controller = require('./controller');

var config = require(__dirname + '/../../config/libcoap');

var uri = '';

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
    setResource(zone.controllerInfo.stateResource || '/io/state', state, done);
  },

  setLeds: function(leds, zone, done)
  {
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
      function setRedLedStep(err)
      {
        if (err) throw 'Nie udało się ustawić zielonej lampy :(';

        var next = this;

        if (!leds.hasOwnProperty('red'))
        {
          next();
        }

        setResource(
          zone.controllerInfo.redLedResource || '/io/redLed',
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

        done(err);
      }
    );
  },

  getInput: function(input, zone, done)
  {
    var resource = zone.controllerInfo[input + 'Resource'];

    if (!resource)
    {
      return done('Unknown input: ' + input);
    }

    getResource(zone.controllerInfo[input + 'Resource'], function(err, stdout)
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

function execCmd(cmd, cb, count)
{
  if (!count)
  {
    count = 0;
  }
  else
  {
    console.debug('<%d> retry of coap-client request: %s', count, cmd);
  }

  exec(cmd, function(err, stdout)
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
      return cb(err, stdout);
    }
  });
}
