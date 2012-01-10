require('./utils/logging');

process.on('uncaughtException', function(err)
{
  console.error('Uncaught exception:\n%s', err.stack);
});

var express  = require('express');
var io       = require('socket.io');
var mongoose = require('mongoose');

(function()
{
  var oldBuildDoc = mongoose.Document.prototype.buildDoc;

  mongoose.Document.prototype.buildDoc = function(fields)
  {
    this.fields = fields || {};

    return oldBuildDoc.call(this, fields);
  };
})();

var expressConfig  = require('../config/express');
var mongooseConfig = require('../config/mongoose');

app = express.createServer();

mongoose.connect(mongooseConfig.uri, function(err)
{
  if (err)
  {
    console.error('Could not connect to MongoDB: %s', err.message);
    process.exit(1);
  }
  else
  {
    console.debug('Connected to MongoDB');

    app.listen(expressConfig.port, function()
    {
      console.debug('Express HTTP server listening on port %d', app.address().port);
      console.info('Started!');
    });
  }
});

app.db = mongoose;

app.io = io.listen(app, {
  log: false
});

app.configure('development', function()
{

});

app.configure('production', function()
{
  app.io.enable('browser client minification');
  app.io.enable('browser client etag');
  app.io.enable('browser client gzip');
});

app.configure(function()
{
  app.use(express.methodOverride());
  app.use(express.bodyParser());
  app.use(app.router);
  app.use(express.static(__dirname + '/../public'));
});

app.configure('development', function()
{
  app.use(express.errorHandler({dumpExceptions: true, showStack: true}));
});

require('./routers');