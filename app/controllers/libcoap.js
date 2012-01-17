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
  });
}
