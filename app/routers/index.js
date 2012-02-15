var guestUser = require('../../config/auth').guestUser;

var limits = 'define("app/models/limits", '
  + JSON.stringify(require(__dirname + '/../../config/limits'))
  + ');';

app.get('/', function(req, res)
{
  res.render(app.settings.env === 'production' ? 'index-min.ejs' : 'index.ejs', {
    layout: false,
    user: JSON.stringify(req.session.user || guestUser)
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
