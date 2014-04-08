// Copyright (c) 2014, Łukasz Walukiewicz <lukasz@walukiewicz.eu>. Some Rights Reserved.
// Licensed under CC BY-NC-SA 4.0 <http://creativecommons.org/licenses/by-nc-sa/4.0/>.
// Part of the walkner-outdoor project <http://lukasz.walukiewicz.eu/p/walkner-outdoor>

require.config({
  baseUrl: './',
  paths: {
    'text': 'vendor/require/text',
    'order': 'vendor/require/order',
    'domReady': 'vendor/require/domReady',

    'jQuery': 'app/vendor/jQuery',
    'Underscore': 'app/vendor/Underscore',
    'Backbone': 'app/vendor/Backbone',
    'moment': 'app/vendor/moment',

    'socket.io': '/socket.io/socket.io.js'
  }
});

requirejs.onError = function(err)
{
  if (err.requireType === 'timeout')
  {
    window.location.reload();
  }
  else
  {
    throw err;
  }
};

require(
[
  'domReady',
  'Backbone',

  'app/time',
  'app/socket',
  'app/routers/main',
  'app/views/viewport',
  'app/touch'
],
function(
  domReady,
  Backbone,
  time,
  socket,
  setupRouting,
  viewport)
{
  setupRouting({});
  domReady(function()
  {
    viewport.render();
    Backbone.history.start({pushState: false});
  });
});
