({
  out: "../public-build/app/min.js",
  baseUrl: "../public",
  dir: "../public-build",
  name: "app/main",
  wrap: true,
  paths: {
    "text"     : "vendor/require/text",
    "order"    : "vendor/require/order",
    "domReady" : "vendor/require/domReady",

    "jQuery"    : "app/vendor/jQuery",
    "Underscore": "app/vendor/Underscore",
    "Backbone"  : "app/vendor/Backbone",
    "moment"    : "app/vendor/moment",

    "socket.io": "empty:socket.io/socket.io.js",

    "app/models/limits": "empty:"
  }
})
