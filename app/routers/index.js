var indexHtml = require('fs').readFileSync(
  __dirname + '/../../public/app/templates/index.html', 'utf8'
);
var limits = 'define("app/models/limits", '
           + JSON.stringify(require(__dirname + '/../../config/limits'))
           + ');';

app.get('/', function(req, res)
{
  res.contentType('html');
  res.send(indexHtml);
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
