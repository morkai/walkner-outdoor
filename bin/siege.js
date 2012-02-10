var exec = require('child_process').exec;
var readFileSync = require('fs').readFileSync;
var express = require('express');
var io = require('socket.io');

app = express.createServer();

app.io = io.listen(app, {log: false});

app.use(app.router);
app.use(express.errorHandler({dumpExceptions: true, showStack: true}));

app.listen(65000);

app.get('/', function(req, res)
{
  res.contentType('html');
  res.send(readFileSync(__dirname + '/siege.html'));
});

app.get('/jquery.js', function(req, res)
{
  res.contentType('js');
  res.send(readFileSync(__dirname + '/../public/vendor/jquery-min.js'));
});

var nextClientId = 0;
var clients = {};
var sockets = app.io.sockets;

sockets.on('connection', function(socket)
{
  process.nextTick(function()
  {
    for (var id in clients)
    {
      emitClientStart(socket, clients[id]);
    }
  });

  socket.on('start client', function(client)
  {
    nextClientId += 1;

    client.started = true;
    client.id = nextClientId.toString();
    client.interval = (parseFloat(client.interval) || 1) * 1000;
    client.startTime = Date.now();
    client.stats = {
      total: 0,
      failed: 0,
      success: 0,
      lastFail: null,
      lastSuccess: null
    };

    clients[client.id] = client;

    emitClientStart(socket, client);

    execClient(client);
  });

  socket.on('stop client', function(client)
  {
    client = clients[client.id];

    if (!client)
    {
      return;
    }

    delete clients[client.id];

    clearTimeout(client.timeout);

    client.timer = null;
    client.started = false;

    sockets.emit('client stopped', {id: client.id});
  });
});

function emitClientStart(socket, client)
{
  sockets.emit('client started', {
    id: client.id,
    args: client.args,
    interval: client.interval,
    startTime: client.startTime,
    stats: client.stats
  });
}

var libcoapConfig = require('../config/libcoap');

function execClient(client)
{
  var args = client.args
    .replace(/\$1/, libcoapConfig.stateFilesDir + '/one.bin')
    .replace(/\$0/, libcoapConfig.stateFilesDir + '/zero.bin');

  var cmd = libcoapConfig.coapClientPath + ' ' + args;

  exec(cmd, function(err, stdout, stderr)
  {
    if (client.started === false)
    {
      return;
    }

    if (err)
    {
      handleFailure(client, err, stderr);
    }
    else
    {
      handleSuccess(client, stdout);
    }

    client.timer = setTimeout(
      function() { execClient(client); },
      client.interval
    );
  });
}

function handleFailure(client, err, stderr)
{
  client.stats.total += 1;
  client.stats.failed += 1;
  client.stats.lastFail = Date.now();

  var log = {type: 'failed', text: err.message};

  sockets.emit('client stats', {
    id: client.id,
    stats: {
      total: client.stats.total,
      failed: client.stats.failed,
      lastFail: client.stats.lastFail,
      log: log
    }
  });

  addLog(client, log);
}

function handleSuccess(client, stdout)
{
  client.stats.total += 1;
  client.stats.success += 1;
  client.stats.lastSuccess = Date.now();

  var log = {type: 'success', text: stdout.toString()};

  sockets.emit('client stats', {
    id: client.id,
    stats: {
      total: client.stats.total,
      success: client.stats.success,
      lastSuccess: client.stats.lastSuccess,
      log: log
    }
  });

  addLog(client, log);
}

function addLog(client, log)
{
  var logs = client.stats.log;

  if (logs.length === 100)
  {
    logs.shift();
  }

  logs.push(log);
}
