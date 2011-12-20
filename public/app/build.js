({
  baseUrl: "../",
  dir: "../../public-build",
  out: "app.min.js",
  name: "app/main",
  wrap: true,
  paths: {
    "socket.io": "empty:"
  }
})
