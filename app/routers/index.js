var indexHtml = require('fs').readFileSync(
  __dirname + '/../../public/app/templates/index.html', 'utf8'
);

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

require('./zones');
require('./history');
require('./programs');
require('./controllers');
