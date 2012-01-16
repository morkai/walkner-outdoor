var mongooseModels = [
  'HistoryEntry',
  'User',
  'Controller',
  'Zone',
  'Program'
];

mongooseModels.forEach(function(modelName)
{
  require('./' + modelName);
});
