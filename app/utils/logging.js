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

  var date = getDateString();
  var string = padR(level, 5, ' ') + ' [' + date + '] ' + args.shift();

  args.unshift(string);

  _console[level].apply(console, args);
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

  return str;
}

function pad0(str)
{
  return (str.toString().length === 1 ? '0' : '') + str;
}

function padR(str, length, chr)
{
  str = str.toString();

  for (var i = str.length; i < length; ++i)
  {
    str += chr;
  }

  return str;
}
