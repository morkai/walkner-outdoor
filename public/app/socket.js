define(
[
  'socket.io'
],
function()
{
  var socket = io.connect();

  return socket;
});
