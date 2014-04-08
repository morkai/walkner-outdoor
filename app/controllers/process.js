// Copyright (c) 2014, Łukasz Walukiewicz <lukasz@walukiewicz.eu>. Some Rights Reserved.
// Licensed under CC BY-NC-SA 4.0 <http://creativecommons.org/licenses/by-nc-sa/4.0/>.
// Part of the walkner-outdoor project <http://lukasz.walukiewicz.eu/p/walkner-outdoor>

require('../utils/logging');

var controllerType = (process.argv[2] || '').trim();

if (controllerType.length === 0)
{
  console.error('Controller type must be specified.');
  process.exit(1);
}

var Controller;

switch (controllerType)
{
  case 'modbus-tcp':
    Controller = require('./ModbusTcpController');
    break;

  case 'libcoap':
    Controller = require('./LibcoapController');
    break;

  case 'remote-libcoap':
    Controller = require('./RemoteLibcoapController');
    break;

  case 'cf-proxy-08':
    Controller = require('./CfProxy08Controller');
    break;

  default:
    console.error('Unknown controller type: %s', controllerType);
    process.exit(1);
}

new Controller(process);
