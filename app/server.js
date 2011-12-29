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

mongoose.connect('mongodb://localhost/walkner-outdoor', function(err)
{
  if (err)
  {
    console.error(err.message);
  }
});

app    = express.createServer();
app.io = io.listen(app);
app.db = mongoose;

app.configure('development', function()
{
  app.use(express.logger('dev'));
});

app.configure('production', function()
{
  app.io.enable('browser client minification');
  app.io.enable('browser client etag');
  app.io.enable('browser client gzip');
  app.io.set('log level', 0);
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

app.listen(require('../config/express').port);
