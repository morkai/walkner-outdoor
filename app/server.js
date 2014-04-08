// Copyright (c) 2014, Łukasz Walukiewicz <lukasz@walukiewicz.eu>. Some Rights Reserved.
// Licensed under CC BY-NC-SA 4.0 <http://creativecommons.org/licenses/by-nc-sa/4.0/>.
// Part of the walkner-outdoor project <http://lukasz.walukiewicz.eu/p/walkner-outdoor>

require('./utils/logging');

process.on('uncaughtException', function(err)
{
  console.error('Uncaught exception:\n%s', err.stack);
});

var fs = require('fs');
var express = require('express');
var MongoStore = require('connect-mongodb');
var io = require('socket.io');
var mongoose = require('mongoose');
var step = require('h5.step');

(function()
{
  var oldBuildDoc = mongoose.Document.prototype.buildDoc;

  mongoose.Document.prototype.buildDoc = function(fields)
  {
    this.fields = fields || {};

    return oldBuildDoc.call(this, fields);
  };
})();

var expressConfig = require('../config/express');
var mongooseConfig = require('../config/mongoose');

app = express.createServer();

step(
  function connectToDbStep()
  {
    console.debug('Starting...');
    console.debug('Connecting to MongoDB...');

    var next = this.next();

    function tryToConnect()
    {
      mongoose.connect(mongooseConfig.uri, function(err)
      {
        if (err)
        {
          setTimeout(tryToConnect, 250);
        }
        else
        {
          next();
        }
      });
    }

    tryToConnect();
  },
  function setUpModelsStep()
  {
    console.debug('Connected to MongoDB!');

    require('./models');
  },
  function markInterruptedHistoryEntries()
  {
    var next = this.next();

    app.db.model('HistoryEntry').markInterruptedEntries(function(err, count)
    {
      if (count)
      {
        console.info('Marked %d history entries as interrupted.', count);
      }

      next();
    });
  },
  function startControllersStep()
  {
    console.debug('Starting controller processes...');

    app.db.model('Controller').startAll(true, this.next());
  },
  function startZonesStep()
  {
    console.debug('Started controller processes!');
    console.debug('Starting zones...');

    app.db.model('Zone').startAll(true, this.next());
  },
  function listenStep()
  {
    console.debug('Started zones!');

    app.listen(expressConfig.port, this.next());
  },
  function startBrowser()
  {
    console.debug(
      'Express HTTP server listening on port %d', app.address().port
    );

    if (app.settings.env === 'production')
    {
      var config = require('../config/browser.js');

      if (typeof config.cmd === 'string' && config.cmd.length !== 0)
      {
        console.debug('Starting the Internet browser.');

        require('child_process').exec(config.cmd);
      }
    }
  },
  function startStep()
  {
    console.info('Started in `%s` environment!', app.settings.env);

    app.startTime = Date.now();
  }
);

app.db = mongoose;

app.io = io.listen(app, {
  log: false
});

app.configure(function()
{
  app.set('views', __dirname + '/templates/');

  app.use(express.cookieParser());
  app.use(express.session({
    secret: '~`z@!#X!@: >#x21"4va',
    store: new MongoStore({db: app.db.connection.db})
  }));
  app.use(express.methodOverride());
  app.use(express.bodyParser());
  app.use(app.router);
});

app.configure('development', function()
{
  app.use(express.static(__dirname + '/../public'));
  app.use(express.errorHandler({dumpExceptions: true, showStack: true}));
});

app.configure('production', function()
{
  app.use(express.static(__dirname + '/../public-build'));
  app.use(express.errorHandler());

  app.io.enable('browser client minification');
  app.io.enable('browser client etag');
  app.io.enable('browser client gzip');
});

require('./routers');
