# Outdoor LED Tester

## Requirements

### node.js

Server-side JavaScript.

Download: http://nodejs.org/#download

Installation instructions: https://github.com/joyent/node/wiki/Installation

### MongoDB

NoSQL database.

Download: http://www.mongodb.org/downloads

Installation instructions: http://www.mongodb.org/display/DOCS/Quickstart

## Installation

Clone the repository:

    git clone git://github.com/morkai/walkner-outdoor.git

or [download](https://github.com/morkai/walkner-outdoor/zipball/master)
and extract it.

Go to the project's directory:

    $ cd walkner-outdoor/

Install the dependencies:

    $ npm install

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

### mongod.conf

Configuration of the MongoDB server. Description of the individual options can
be found in
[the MongoDB documentation](http://www.mongodb.org/display/DOCS/File+Based+Configuration).

## Start

If not yet running, start the MongoDB:

    $ mongod -f walkner-outdoor/config/mongod.conf

Start the application server in `development` or `production` environment:

  * under *nix:

        $ NODE_ENV=development node walkner-outdoor/server/index.js

  * under Windows:

        $ SET NODE_ENV=development
        $ node walkner-outdoor/server/index.js

To run the application in `production` environment one must have
[r.js](https://github.com/jrburke/r.js) properly set up and then execute the
following commands:

    $ r.js walkner-outdoor/bin/build-client.js
    $ r.js walkner-outdoor/bin/build-min.js

Application should be available on a port defined in `config/express.js` file
(`8080` by default). Point the Internet browser to http://127.0.0.1:8080/.
