({
  baseUrl: "../public",
  dir: "../public-build",
  name: "app/main",
  wrap: true,
  optimizeCss: "standard",
  paths: {
    "text"     : "vendor/require/text",
    "order"    : "vendor/require/order",
    "domReady" : "vendor/require/domReady",

    "jQuery"    : "app/vendor/jQuery",
    "Underscore": "app/vendor/Underscore",
    "Backbone"  : "app/vendor/Backbone",
    "moment"    : "app/vendor/moment",

    "socket.io": "empty:",

    "app/models/limits": "empty:"
  }
})
