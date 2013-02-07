var format = require('util').format;
var os = require('os');
var fs = require('fs');
var exec = require('../utils/exec');
var path = require('path');
var _ = require('underscore');
var step = require('h5.step');
var auth = require('../utils/middleware').auth;
var devscan = require('../utils/devscan');
var controllerProcesses = require('../models/controllerProcesses');
var diagConfig = require('../../config/diag');
var authDiag = auth('diag');

app.get('/diag', authDiag, function(req, res, next)
{
  var Controller = app.db.model('Controller');
  var Zone = app.db.model('Zone');

  var data = {startTime: app.startTime, eth0: [], wlan0: []};

  step(
    function getIpAddressesStep()
    {
      _.each(os.networkInterfaces(), function(addresses, iface)
      {
        if (iface === 'eth0' || iface.indexOf('Local') === 0)
        {
          _.each(addresses, function(address)
          {
            if (address.family === 'IPv4' && !address.interval)
            {
              data.eth0.push(address.address);
            }
          });
        }
        else if (iface === 'wlan0' || iface.indexOf('Wireless') === 0)
        {
          _.each(addresses, function(address)
          {
            if (address.family === 'IPv4' && !address.interval)
            {
              data.wlan0.push(address.address);
            }
          });
        }
      });
    },
    function getAllControllersStep()
    {
      Controller.find().asc('name').run(this.next());
    },
    function setControllersStep(err, allControllers)
    {
      if (err)
      {
        return this.done(next, err);
      }

      var startedControllers = controllerProcesses.getStartedControllers();
      var controllers = data.controllers = [];

      allControllers.forEach(function(controller)
      {
        var online = controller._id in startedControllers;

        if (online)
        {
          controller = startedControllers[controller._id];
        }
        else
        {
          controller = controller.toJSON();
        }

        controller.online = online;

        controllers.push(controller);
      });
    },
    function getAllZonesStep(err)
    {
      if (err)
      {
        return this.done(next, err);
      }

      Zone.find().asc('name').run(this.next());
    },
    function setZonesStep(err, allZones)
    {
      if (err)
      {
        return this.done(next, err);
      }

      var startedZones = controllerProcesses.getStartedZones();
      var zones = data.zones = [];

      allZones.forEach(function(zone)
      {
        var online = zone._id in startedZones;

        if (online)
        {
          var controllerId = zone.controller;

          zone = startedZones[zone._id];
          zone.controller = controllerId;
        }
        else
        {
          zone = zone.toJSON();
        }

        zone.online = online;

        zones.push(zone);
      });
    },
    function setProgramsStep()
    {
      data.programs = controllerProcesses.getStartedPrograms();
    },
    function getAllBackupsStep()
    {
      var nextStep = this.next();

      getBackupsList(function(err, backups)
      {
        if (!err)
        {
          data.backups = backups;
        }

        return nextStep();
      });
    },
    function sendResponseStep()
    {
      res.send(data);
    }
  );
});

app.get('/diag/backups', authDiag, function(req, res, next)
{
  getBackupsList(function(err, backups)
  {
    if (err)
    {
      return next(err);
    }

    return res.json(backups);
  });
});

app.post('/diag/backups', authDiag, function(req, res, next)
{
  createBackupFile(function(err, backupId)
  {
    if (err)
    {
      return next(err);
    }

    return res.json(backupId);
  });
});

app.del('/diag/backups', authDiag, function(req, res, next)
{
  getBackupsList(function(err, backups)
  {
    if (err)
    {
      return next(err);
    }

    var weekAgo = Date.now() - (3600 * 24 * 7 * 1000);

    backups = backups.filter(function(backup, i)
    {
      return i > 6 || backup.time < weekAgo;
    });

    backups.forEach(function(backup)
    {
      removeBackupFile(backup.id);
    });

    var removedBackupIds = _.pluck(backups, 'id');

    app.io.sockets.emit('backup removed', removedBackupIds);

    return res.send(204);
  });
});

app.get('/diag/backups/:id', function(req, res, next)
{
  if (req.query.key && req.query.key === diagConfig.backupSecretKey)
  {
    return findRequestedBackupFile();
  }

  return authDiag(req, res, findRequestedBackupFile);

  function findRequestedBackupFile()
  {
    if (req.params.id === 'latest')
    {
      return findLatestBackupFile();
    }

    return sendBackupFile(req.params.id);
  }

  function findLatestBackupFile()
  {
    getBackupsList(function(err, backups)
    {
      if (err)
      {
        return next(err);
      }

      if (backups.length > 0)
      {
        return sendBackupFile(backups[0].id);
      }

      return createBackupFile(function(err, backupId)
      {
        if (err)
        {
          return next(err);
        }

        return sendBackupFile(backupId);
      });
    });
  }

  function sendBackupFile(backupId)
  {
    backupId = parseInt(backupId);

    if (isNaN(backupId))
    {
      return res.send(400);
    }

    var createdAt = new Date(backupId).toISOString().replace(/-|:/g, '').substr(2, 13);
    var backupFile = path.join(diagConfig.backupsPath, backupId + '.tar.gz');
    var backupName = 'outdoor-mongodump-' + backupId + '-' + createdAt + '.tar.gz';

    return fs.stat(backupFile, function(err, stats)
    {
      if (err)
      {
        if (err.code === 'ENOENT')
        {
          return res.send(404);
        }

        return next(err);
      }

      if (!stats.isFile())
      {
        return res.send(400);
      }

      return res.download(backupFile, backupName);
    });
  }
});

app.del('/diag/backups/:id', authDiag, function(req, res, next)
{
  var backupId = parseInt(req.params.id);

  if (isNaN(backupId))
  {
    return res.send(400);
  }

  return removeBackupFile(backupId, function(err)
  {
    if (err)
    {
      return next(err);
    }

    app.io.sockets.emit('backup removed', backupId);

    return res.send(204);
  });
});

app.get('/diag/devscan', authDiag, function(req, res, next)
{
  devscan.scan(function(err, result)
  {
    if (err)
    {
      return next(err);
    }

    return res.json(result);
  });
});

function getBackupsList(done)
{
  step(
    function getAllBackupsStep()
    {
      fs.readdir(diagConfig.backupsPath, this.next());
    },
    function filterAndStatBackupsStep(err, files)
    {
      if (err)
      {
        return this.done(done, err);
      }

      var backupFileRegExp = /\.tar\.gz$/;

      files = files.filter(function(file)
      {
        return backupFileRegExp.test(file);
      });

      var createStatsGroup = this.group;

      files.forEach(function(file)
      {
        if (backupFileRegExp.test(file))
        {
          var statsGroup = createStatsGroup();

          fs.stat(path.join(diagConfig.backupsPath, file), function(err, stats)
          {
            if (stats)
            {
              stats.file = file;
            }

            return statsGroup(err, stats);
          });
        }
      });
    },
    function setBackupsStep(err, stats)
    {
      if (err)
      {
        return done(err);
      }

      var backups = (stats || []).map(prepareBackupFileFromStats);

      backups.sort(function(a, b)
      {
        return b.time - a.time;
      });

      return done(null, backups);
    }
  )
}

function prepareBackupFileFromStats(stats, file)
{
  return {
    id: (stats.file || file).replace('.tar.gz', ''),
    file: stats.file || file,
    size: stats.size,
    time: stats.ctime.getTime()
  };
}

function createBackupFile(done)
{
  var backupId = Date.now().toString();
  var backupDir = path.join(diagConfig.backupsPath, backupId);
  var options = {
    env: process.env,
    cwd: diagConfig.backupsPath,
    timeout: 60000
  };
  var cmd = format(
    '%s --db "%s" --out "%s"',
    diagConfig.mongodump,
    app.db.connection.name,
    backupDir
  );

  exec(cmd, options, function handleMongodump(err)
  {
    if (err)
    {
      return done(new Error(format(
        "Failed to dump a database: %s", err.message || err
      )));
    }

    var tarFile = backupId + '.tar';
    var cmd = format(
      'tar -c --directory="%s" --file="%s" "%s"',
      backupDir,
      tarFile,
      app.db.connection.name
    );

    return exec(cmd, options, function handleTar(err)
    {
      if (err)
      {
        cleanup(true, backupDir);

        return done(new Error(format(
          "Failed to archive the backup directory: %s", err.message || err
        )));
      }

      var cmd = format('gzip -f9 "%s"', tarFile);

      return exec(cmd, options, function handleGzip(err)
      {
        if (err)
        {
          cleanup(false, path.join(diagConfig.backupsPath, tarFile));

          return done(new Error(format(
            "Failed to compress the backup archive: %s", err.message || err
          )));
        }

        cleanup(true, backupDir);

        var gzipFile = tarFile + '.gz';

        fs.stat(path.join(diagConfig.backupsPath, gzipFile), function(err, stats)
        {
          if (!err)
          {
            app.io.sockets.emit('backup created', prepareBackupFileFromStats(stats, gzipFile));
          }
        });

        console.info("Created a new database backup: %s", backupId);

        scheduleBackup();

        return done(null, backupId);
      });
    });
  });
}

function removeBackupFile(backupId, done)
{
  fs.unlink(path.join(diagConfig.backupsPath, backupId + '.tar.gz'), function(err)
  {
    if (err)
    {
      return done && done(err);
    }

    if (done)
    {
      return done();
    }

    app.io.sockets.emit('backup removed', backupId);
  });
}

function cleanup(isDir, path, done)
{
  var cmd;

  if (process.platform === 'win32')
  {
    if (isDir)
    {
      cmd = format('RMDIR /S /Q "%s"', path);
    }
    else
    {
      cmd = format('DEL /F /Q "%s"', path);
    }
  }
  else
  {
    cmd = format('rm -rf "%s"', path);
  }

  var options = {timeout: 10000};

  return exec(cmd, options, function(err)
  {
    if (err)
    {
      console.error("Failed to cleanup [%s]: %s", dir, err.message);
    }

    return done && done(err);
  });
}

var backupTimer = null;

function scheduleBackup(offset)
{
  clearTimeout(backupTimer);

  var backupInterval = (diagConfig.backupInterval * 1000) - (offset || 0);

  backupTimer = setTimeout(createAndScheduleBackupFile, backupInterval);

  var nextBackupDate = new Date(Date.now() + backupInterval);

  console.info('Scheduled a new database backup to happen at %s', nextBackupDate.toUTCString());
}

getBackupsList(function(err, backups)
{
  if (err)
  {
    console.error('Failed to retrieve the backup list at startup: %s', err.stack);

    return scheduleBackup();
  }

  if (backups.length === 0)
  {
    return createAndScheduleBackupFile();
  }

  var latestBackup = backups[0];
  var backupInterval = diagConfig.backupInterval * 1000;
  var now = Date.now();

  if (now - latestBackup.time >= backupInterval)
  {
    return createAndScheduleBackupFile();
  }

  return scheduleBackup(now - latestBackup.time);
});

function createAndScheduleBackupFile()
{
  createBackupFile(function(err)
  {
    if (err)
    {
      console.error('Failed to create a backup at startup: %s', err.stack);

      scheduleBackup();
    }
  })
}
