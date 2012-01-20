require('./utils/logging');

process.on('uncaughtException', function(err)
{
  console.error('Uncaught exception:\n%s', err.stack);
});

require('fs').writeFile(
  __dirname + '/../var/pids/server.pid', process.pid
);

var express  = require('express');
var io       = require('socket.io');
var mongoose = require('mongoose');
var step     = require('step');

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

step(
  function connectToDbStep()
  {
    console.debug('Starting...');
    console.debug('Connecting to MongoDB...');

    mongoose.connect(mongooseConfig.uri, this);
  },
  function setUpModelsStep(err)
  {
    if (err)
    {
      console.error('Could not connect to MongoDB: %s', err.message);
      process.exit(1);
    }

    console.debug('Connected to MongoDB!');

    require('./models');

    return this();
  },
  function startControllersStep()
  {
    console.debug('Starting controller processes...');

    app.db.model('Controller').startAll(this);
  },
  function startZonesStep()
  {
    console.debug('Started controller processes!');
    console.debug('Starting zones...');

    app.db.model('Zone').startAll(this);
  },
  function listenStep(err)
  {
    console.debug('Started zones!');

    app.listen(expressConfig.port, this);
  },
  function startStep()
  {
    console.debug(
      'Express HTTP server listening on port %d', app.address().port
    );
    console.info('Started!');

    app.startTime = Date.now();
  }
);

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
  app.use(express.cookieParser());
  app.use(express.session({secret: '~`z@!#X!@: >#x21"4va'}));
  app.use(express.methodOverride());
  app.use(express.bodyParser());
  app.use(app.router);
  app.use(express.static(__dirname + '/../public'));
  app.set('views', __dirname + '/templates/');
});

app.configure('development', function()
{
  app.use(express.errorHandler({dumpExceptions: true, showStack: true}));
});

require('./routers');
