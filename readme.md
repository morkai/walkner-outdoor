# Outdoor LED Tester

## Requirements

### node.js

Node.js is a server side software system designed for writing scalable
Internet applications in JavaScript.

  * __Version__: 0.8.x
  * __Website__: http://nodejs.org/
  * __Download__: http://nodejs.org/download/
  * __Installation guide__: https://github.com/joyent/node/wiki/Installation

### MongoDB

MongoDB is a scalable, high-performance, open source NoSQL database.

  * __Version__: 2.x.x
  * __Website__: http://mongodb.org/
  * __Download__: http://www.mongodb.org/downloads
  * __Installation guide__: http://www.mongodb.org/display/DOCS/Quickstart

### PATH executables

For the database backup functionality to work, `tar` and `gzip` executables
should be reachable by `node` process through the `PATH` environmental variable.

Most *nix distributions already have them out of the box.
For Windows installations, see [Gow](https://github.com/bmatzelle/gow/wiki).

## Installation

Clone the repository:

```
git clone git://github.com/morkai/walkner-outdoor.git
```

or [download](https://github.com/morkai/walkner-outdoor/zipball/master)
and extract it.

Go to the project's directory and install the dependencies:

```
cd walkner-outdoor/
npm install
```

Give write permissions to the `var/` directory and all of its children:

```
chmod -R 0777 var
```

## Configuration

Configuration files are the JavaScript files residing in the `config/`
directory.

### express.js

Configuration of the HTTP server [express](http://expressjs.com/).

  * `port` - port on which the HTTP server should listen.

### mongoose.js

Configuration of the _MongoDB_ client.

  * `uri` - connection URI in the following format:
    `mongodb://<host>[:<port>]/<dbname>`.

### libcoap.js

Configuration of a controller based on [libcoap](http://sourceforge.net/projects/libcoap/).

  * `maxRetries` - how many times a request should be retried before it is
    considered as failed.

  * `disconnectTimeout` - a number of milliseconds, after which a connection
    with the controller is considered as lost. Countdown starts after every
    failed request until it reaches 0 or any other request succeeds.

  * `coapClientTimeout` - a number of milliseconds after which the `coap-client`
     process will be killed if it does not exit before that time.

  * `coapClientPath` - an absolute path to the `coap-client` executable.

  * `stateFilesDir` - an absolute path to a directory with `one.bin`
    and `zero.bin` files.

### cf-proxy.js

Configuration of a controller based on [californium-proxy-node](https://github.com/morkai/californium-proxy-node).

  * `host` - an address of the proxy server.

  * `port` - a port of the proxy server.

  * `disconnectTimeout` - a number of milliseconds, after which a connection
    with the controller is considered as lost. Countdown starts after every
    failed request until it reaches 0 or any other request succeeds.

### logging.js

Logs configuration. Logs of the following levels will be redirected to `stdout`:
`log`, `debug`, `info`, `warn` and `error`.

  * `productionLevels` - object defining what logs should make it through
    the log filter, if the `NODE_ENV` is set to `production`.

  * `developmentLevels` - object defining what logs should make it through
    the log filter, if the `NODE_ENV` is set to `development`.

### auth.js

Configuration of authentication and authorization.

  * `superUser` - object of a user with all privileges.
    One can log in as a super user even if it's not in the database.
    Handy, if run on an empty database.

  * `guestUser` - object of a user assigned to not logged in browser clients.

### limits.js

Features limit configuration.

  * `maxZones` - a maximum number of zones that can be created in the app.
    After reaching the limit, action button to add new zones is disabled.

  * `maxPrograms` - a maximum number of programs that can be created in the app.
    After reaching the limit, action button to add new programs is disabled.

### browser.js

Configuration of a browser that is started by the server when run in
the production environment.

  * `cmd` - command that opens a browser pointed to the application.

### diag.js

Configuration of the diagnostic module.

  * `backupSecretKey` - Value of the `key` query parameter used to bypass
    the session authorization during download of a backup file.

  * `backupInterval` - Number of seconds between the automatic database
    backups. Timer is reset, if a new backup is created manually.

  * `backupsPath` - Path to a directory where the database backups should
    be stored.

  * `mongodump` - Path to the [mongodump](http://docs.mongodb.org/manual/reference/mongodump/) executable.

  * `coordinatorIp` - IP address of a COAP controller with devscan support
    (must exist in the database).

### ui.js

Configuration related to the UI.

  * `gatewayUrl` - a function that generates a link to the Walkner Gateway
    based on a hostname of the user. Return `null` to hide the link.

  * `touchEnabled` - A list of touch enablers, i.e. objects specifying values
    that when matched against client's values will result in that client
    having UI with touch features enabled. Supported types are:

      * `hostname` - a value of the `Host` header without a port,
      * `ip` - remote IP address of the client.

### mongod.conf

Configuration of the MongoDB server. Description of the individual options can
be found in
[the MongoDB documentation](http://www.mongodb.org/display/DOCS/File+Based+Configuration).

## Start

If not yet running, start the MongoDB:

```
mongod -f walkner-outdoor/config/mongod.conf
```

Start the application server in `development` or `production` environment:

  * under *nix:

    ```
    NODE_ENV=development node walkner-outdoor/server/index.js
    ```

  * under Windows:

    ```
    SET NODE_ENV=development
    node walkner-outdoor/server/index.js
    ```

To run the application in `production` environment one must optimize and minify
the frontend using r.js. To do that, execute the `public-build` npm script:

npm run-script public-build

Application should be available on a port defined in `config/express.js` file
(`8080` by default). Point the Internet browser to http://127.0.0.1:8080/.

## License

walkner-outdoor is released under the [CC BY-NC-SA 4.0 License](https://github.com/morkai/walkner-outdoor/blob/master/license.md).

Copyright (c) 2014, Łukasz Walukiewicz (lukasz@walukiewicz.eu). Some Rights Reserved.
