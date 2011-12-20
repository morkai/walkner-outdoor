define(
[
  'jQuery'
],
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

  return time;
});