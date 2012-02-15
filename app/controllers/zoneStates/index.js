[
  'stopped',
  'disconnected',
  'connected',
  'programRunning',
  'programFinished',
  'programStopped',
  'programErrored'
].forEach(function(stateName)
{
  exports[stateName] = require('./' + stateName);
});
