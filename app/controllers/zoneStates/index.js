// Copyright (c) 2014, Łukasz Walukiewicz <lukasz@walukiewicz.eu>. Some Rights Reserved.
// Licensed under CC BY-NC-SA 4.0 <http://creativecommons.org/licenses/by-nc-sa/4.0/>.
// Part of the walkner-outdoor project <http://lukasz.walukiewicz.eu/p/walkner-outdoor>

[
  'stopped',
  'disconnected',
  'connected',
  'programRunning',
  'programFinished',
  'programStopped',
  'programErrored',
  'remote/stopped',
  'remote/disconnected',
  'remote/connected',
  'remote/programRunning',
  'remote/programFinished',
  'remote/programStopped',
  'remote/programErrored'
].forEach(function(stateName)
{
  exports[stateName] = require('./' + stateName);
});
