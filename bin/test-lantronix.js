var exec   = require('child_process').exec;
var config = require('../config/libcoap');

var nrToIp = {
  1: '1111::220:4aff:fecb:3169',
  2: '1111::220:4aff:fee0:19df',
  3: '1111::220:4aff:fee0:28f0',
  4: '1111::220:4aff:fee0:28f4'
};

if (process.argv.length < 3)
{
  console.log('Choose a controller:');

  for (var nr in nrToIp)
  {
    console.log('%d. [%s]', nr, nrToIp[nr]);
  }

  process.exit(1);
}

var nr = parseInt(process.argv[2]);
var ip;

if (!isNaN(nr) && nr in nrToIp)
{
  ip = nrToIp[nr];
}
else
{
  ip = process.argv[2];
}

console.log('Controller: [%s]', ip);

var resource = process.argv[3] || '/io/state';

console.log('Resource  : [%s]', resource);

var uri = 'coap://[' + ip + ']' + resource;

var actions = [];

for (var i = 4; i < process.argv.length; ++i)
{
  actions.push(process.argv[i]);
}

if (actions.length === 0)
{
  actions.push('get');
}

act(0);

function act(i)
{
  if (i === actions.length)
  {
    return;
  }

  console.log('----------');
  console.log('%s:', actions[i]);

  switch (actions[i])
  {
    case 'get':
      get(i);
      break;

    case 'set0':
      set(i, 0);
      break;

    case 'set1':
      set(i, 1);
      break;
  }
}

function get(i)
{
  var cmd = config.coapClientPath + ' ' + uri;

  console.log(cmd);

  exec(cmd, handleExec.bind(null, i));
}

function set(i, state)
{
  var file = config.stateFilesDir + '/' + (state ? 'one.bin' : 'zero.bin');
  var cmd  = config.coapClientPath + ' -m put -f ' + file + ' ' + uri;

  console.log(cmd);

  exec(cmd, handleExec.bind(null, i));
}

function handleExec(i, err, stdout, stderr)
{
  if (err)
  {
    console.error(err);
  }
  else
  {
    console.log(stdout);
  }

  setTimeout(function()
  {
    act(i + 1);
  }, 1000);
}