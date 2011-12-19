require.config({
  baseUrl: './'
});

require(
[
  'domReady',
  'jQuery',
  'Underscore',
  'Backbone',

  'app/socket',
  'app/routers/main',
  'app/views/viewport'
],
function(domReady, $, _, Backbone, socket, setupRouting, viewport)
{
  setupRouting({});
  domReady(function()
  {
    viewport.render();
    Backbone.history.start({pushState: false});
  });
});
