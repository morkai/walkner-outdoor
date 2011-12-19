define(
[
  '/socket.io/socket.io.js'
],
function()
{
  var socket = io.connect();

  return socket;
});
