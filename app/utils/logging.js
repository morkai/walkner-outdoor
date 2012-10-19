var format = require('util').format;
var config = require('../../config/logging');

var logLevels = process.env.NODE_ENV === 'production'
  ? config.productionLevels
  : config.developmentLevels;

var _console = {
  debug: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error
};

for (var level in _console)
{
  console[level] = decorateLog.bind(null, level);
}

function decorateLog(level)
{
  if (arguments.length === 1)
  {
    return _console.log();
  }

  if (!logLevels[level])
  {
    return;
  }

  var args = Array.prototype.slice.call(arguments);

  args.shift();

  var message = level + '\t' + getDateString() + '\t' + format.apply(null, args).trim() + '\n';

  if (level === 'error')
  {
    process.stderr.write(message);
  }
  else
  {
    process.stdout.write(message);
  }
}

function getDateString()
{
  var now = new Date();
  var str = now.getUTCFullYear().toString().substr(2);

  str += '-' + pad0(now.getUTCMonth() + 1);
  str += '-' + pad0(now.getUTCDate());
  str += ' ' + pad0(now.getUTCHours());
  str += ':' + pad0(now.getUTCMinutes());
  str += ':' + pad0(now.getUTCSeconds());
  str += '.';

  var ms = now.getUTCMilliseconds();

  if (ms < 10)
  {
    str += '00';
  }
  else if (ms < 100)
  {
    str += '0';
  }

  str += ms;

  return str;
}

function pad0(str)
{
  return (str.toString().length === 1 ? '0' : '') + str;
}
