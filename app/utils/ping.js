var childProcess = require('child_process');

module.exports = function(host, interval, consumer)
{
  var receivedTotal = 0;
  var receivedCount = 0;
  var totalCount    = 0;
  var results       = {
    last: 0,
    avg : 0,
    min : Number.MAX_VALUE,
    max : Number.MIN_VALUE,
    loss: 0
  };

  function consume(value)
  {
    if (totalCount === Number.MAX_VALUE)
    {
      receivedTotal = 0;
      receivedCount = 0;
      totalCount    = 0;
    }

    totalCount += 1;

    results.last = value;

    if (isNaN(value))
    {
      results.last = NaN;
      results.loss = 100 - Math.round(receivedCount / totalCount * 100);
    }
    else
    {
      value = Math.ceil(value);

      receivedTotal += value;
      receivedCount += 1;

      results.last = value;
      results.avg  = Math.ceil(receivedTotal / receivedCount);

      if (value < results.min)
      {
        results.min = value;
      }

      if (value > results.max)
      {
        results.max = value;
      }
    }

    consumer(results);
  }

  if (process.platform === 'win32')
  {
    return pingWin32(host, interval, consume);
  }
  else
  {
    return pingNix(host, interval, consume);
  }
};

function pingWin32(host, interval, consume)
{
  var timer;

  function doPingWin32()
  {
    childProcess.exec('ping -n 1 ' + host, function(err, stdout)
    {
      if (err)
      {
        consume(NaN);
      }
      else
      {
        var matches = stdout.match(/(?:=|<)([0-9]+\.?[0-9]*)ms /);

        consume(matches ? parseFloat(matches[1]) : NaN);
      }

      timer = setTimeout(doPingWin32, interval * 1000);
    });
  }

  doPingWin32();

  return function() { clearTimeout(timer); };
}

function pingNix(host, interval, consume)
{
  var cmd       = host.indexOf('.') === -1 ? 'ping6' : 'ping';
  var args      = ['-i', interval, host];
  var cancelled = false;
  var child;

  function doPingNix()
  {
    if (cancelled)
    {
      return;
    }

    child = childProcess.spawn(cmd, args);

    child.stdout.setEncoding('utf8');
    child.stdout.on('data', function(data)
    {
      var matches = data.match(/=([0-9]+\.?[0-9]*) m(?:s|sec)/);

      consume(matches ? parseFloat(matches[1]) : NaN);
    });
    child.on('exit', function()
    {
      process.nextTick(doPingNix);
    });
  }

  doPingNix();

  return function()
  {
    cancelled = true;

    child.kill();
  };
}
