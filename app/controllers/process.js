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

  default:
    console.error('Unknown controller type: %s', controllerType);
    process.exit(1);
}

new Controller(process);
