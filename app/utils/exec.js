var exec = require('child_process').exec;

module.exports = process.platform === 'win32' ? winExec : exec;

function winExec(cmd, options, callback)
{
  if (typeof options === 'function')
  {
    callback = options;
    options = {};
  }

  if (typeof options.cwd !== 'string')
  {
    options.cwd = process.cwd;
  }

  cmd = 'cd /D "' + options.cwd + '" & ' + cmd;

  return exec(cmd, options, callback);
}
