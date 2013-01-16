var _ = require('underscore');
var guestUser = require('../../config/auth').guestUser;
var uiConfig = require('../../config/ui');

var limits = 'define("app/models/limits", '
  + JSON.stringify(require(__dirname + '/../../config/limits'))
  + ');';

app.get('/', function(req, res)
{
  var ipAddress = req.connection.remoteAddress;
  var hostname = typeof req.headers.host === 'string'
    ? req.headers.host.split(':')[0] : 'localhost';
  var touchEnabled = false;

  for (var i = 0, l = uiConfig.touchEnablers.length; i < l; ++i)
  {
    var touchEnabler = uiConfig.touchEnablers[i];
    var expectedValue;
    var actualValue;

    switch (touchEnabler.type)
    {
      case 'hostname':
        expectedValue = touchEnabler.value;
        actualValue = hostname;
        break;

      case 'ip':
        expectedValue = touchEnabler.value;
        actualValue = ipAddress;
        break;
    }

    if (actualValue === expectedValue)
    {
      touchEnabled = true;

      break;
    }
  }

  var user = _.extend(req.session.user || guestUser, {
    ipAddress: ipAddress,
    touchEnabled: touchEnabled,
    gatewayUrl: uiConfig.gatewayUrl(hostname)
  });

  res.render(app.settings.env === 'production' ? 'index-min.ejs' : 'index.ejs', {
    layout: false,
    user: JSON.stringify(user)
  });
});

app.get('/ping', function(req, res)
{
  res.send('pong');
});

app.get('/time', function(req, res)
{
  res.send(Date.now().toString());
});

app.get('/app/models/limits.js', function(req, res)
{
  res.send(limits, {'Content-Type': 'text/javascript'});
});

require('./zones');
require('./history');
require('./programs');
require('./users');
require('./controllers');
require('./auth');
require('./diag');
