var indexHtml = require('fs').readFileSync(
  'public/app/templates/index.html', 'utf8'
);

app.get('/', function(req, res)
{
  res.contentType('html');
  res.send(indexHtml);
});

require('./zones');
require('./programs');
require('./controllers');
