// Copyright (c) 2014, Łukasz Walukiewicz <lukasz@walukiewicz.eu>. Some Rights Reserved.
// Licensed under CC BY-NC-SA 4.0 <http://creativecommons.org/licenses/by-nc-sa/4.0/>.
// Part of the walkner-outdoor project <http://lukasz.walukiewicz.eu/p/walkner-outdoor>

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
    options.cwd = process.cwd();
  }

  cmd = 'cd /D "' + options.cwd + '" & ' + cmd;

  return exec(cmd, options, callback);
}
