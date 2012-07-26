define(
[
  'jQuery'
],
/**
 * @param {jQuery} $
 */
function($)
{
  var time = {offset: 0};

  var startTime = Date.now();

  $.get('/time', function(serverTime)
  {
    var endTime = Date.now();
    var reqTime = endTime - startTime;

    serverTime = parseInt(serverTime) + reqTime;

    time.offset = serverTime - endTime;
  });

  time.toSeconds = function(str)
  {
    if (typeof str === 'number')
    {
      return str;
    }

    if (typeof str !== 'string')
    {
      return 0;
    }

    var multipliers = {
      g: 3600,
      h: 3600,
      m: 60,
      s: 1
    };

    var time = str.trim();
    var seconds = parseInt(time);

    if (/^[0-9]+\.?[0-9]*$/.test(time) === false)
    {
      var re = /([0-9\.]+) *(h|m|s)[a-z]*/ig;
      var match;

      seconds = 0;

      while (match = re.exec(time))
      {
        seconds += match[1] * multipliers[match[2].toLowerCase()];
      }
    }

    return seconds;
  };

  time.toString = function(time)
  {
    if (typeof time !== 'number' || time <= 0)
    {
      return '0s';
    }

    var str = '';
    var hours = Math.floor(time / 3600);

    if (hours > 0)
    {
      str += ' ' + hours + 'h';
      time = time % 3600;
    }

    var minutes = Math.floor(time / 60);

    if (minutes > 0)
    {
      str += ' ' + minutes + 'min';
      time = time % 60;
    }

    var seconds = time;

    if (seconds >= 1)
    {
      str += ' ' + Math.round(seconds) + 's';
    }
    else if (seconds > 0 && str === '')
    {
      str += ' ' + (seconds * 1000) + 'ms';
    }

    return str.substr(1);
  };

  return time;
});
