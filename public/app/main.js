require.config({
  baseUrl: './',
  paths: {
    'socket.io': '/socket.io/socket.io.js'
  }
});

require(
[
  'domReady',
  'jQuery',
  'Underscore',
  'Backbone',

  'app/time',
  'app/socket',
  'app/routers/main',
  'app/views/viewport'
],
function(domReady, $, _, Backbone, time, socket, setupRouting, viewport)
{
  setupRouting({});
  domReady(function()
  {
    viewport.render();
    Backbone.history.start({pushState: false});
  });
});
