var fs = require('fs');
var childProcess = require('child_process');

var DEFAULT_COORDINATOR_ARGS = {
  '-T': '2222::3',
  '-r': '1111::',
  '-e': 'eth1'
};

/**
 * @type {String}
 */
var emulDataFile = __dirname + '/emul.txt';

/**
 * @type {String}
 */
var emulProcessFile = 'ipv6_obs.elf';

/**
 * @type {Number}
 */
var cpuLimit = -1;

/**
 * @type {Number}
 */
var coordinatorId = 1;

/**
 * @type {Array.<String>}
 */
var coordinatorArgs = [];

/**
 * @type {Object.<Number, Node>}
 */
var emulData = {};

function parseEmulDataFile()
{
  fs.readFile(emulDataFile, 'utf8', function(err, rawEmulData)
  {
    if (err)
    {
      console.error('Failed to read the emulation data file: %s', err.message);
      process.exit();
    }
    else
    {
      parseEmulData(rawEmulData);
    }
  });
}

function parseEmulData(rawEmulData)
{
  console.log('Parsing emulation data file...');

  var newEmulData = {};

  rawEmulData
    .trim()
    .split('\n')
    .map(function(line) { return line.trim(); })
    .filter(function(line) { return line.length > 0 && line[0] !== ';'; })
    .map(function(line)
    {
      var parts = line.split(/\s+/);
      var id = parseInt(parts.shift());

      if (isNaN(id) || id < 1)
      {
        return null;
      }

      var sees = [];

      parts.forEach(function(part)
      {
        var visibleNode = parseInt(part);

        if (!isNaN(visibleNode) && visibleNode > 0)
        {
          sees.push(visibleNode);
        }
      });

      return new Node(id, sees);
    })
    .filter(function(node) { return node !== null; })
    .forEach(function(node)
    {
      newEmulData[node.id] = node;
    });

  var diff = diffEmulData(newEmulData);

  applyEmulDataDiff(diff);

  console.log('Managing %d nodes...', Object.keys(emulData).length);
}

/**
 * @param {Object.<Number, Node>} newEmulData
 * @return {EmulDataDiff}
 */
function diffEmulData(newEmulData)
{
  var diff = new EmulDataDiff();
  var nodeId;

  for (nodeId in newEmulData)
  {
    var newNode = newEmulData[nodeId];
    var oldNode = emulData[nodeId];

    if (typeof oldNode === 'undefined')
    {
      diff.added.push(newNode);
    }
    else if (newNode.mask !== oldNode.mask)
    {
      diff.updated[nodeId] = newNode;
    }
  }

  for (nodeId in emulData)
  {
    if (!(nodeId in newEmulData))
    {
      diff.removed.push(nodeId);
    }
  }

  return diff;
}

/**
 * @param {EmulDataDiff} diff
 */
function applyEmulDataDiff(diff)
{
  for (var nodeId in diff.updated)
  {
    var oldNode = emulData[nodeId];
    var newNode = diff.updated[nodeId];

    oldNode.updated(newNode);
  }

  diff.removed.forEach(function(removedNodeId)
  {
    var removedNode = emulData[removedNodeId];

    delete emulData[removedNodeId];

    removedNode.removed();
  });

  diff.added.forEach(function(newNode)
  {
    emulData[newNode.id] = newNode;

    newNode.added();
  });
}

/**
 * @constructor
 * @param {Number} id
 * @param {Array.<Number>} sees
 */
function Node(id, sees)
{
  /**
   * @type {Number}
   */
  this.id = id;

  /**
   * @type {Array.<Number>}
   */
  this.sees = sees;

  var mask = 0;

  for (var i = 0, l = sees.length; i < l; ++i)
  {
    mask |= Math.pow(2, sees[i] - 1);
  }

  /**
   * @type {Number}
   */
  this.mask = mask << 1;

  /**
   * @private
   * @type {?ChildProcess}
   */
  this.process = null;

  /**
   * @private
   * @type {?ChildProcess}
   */
  this.cpuLimitProcess = null;

  /**
   * @type {?Number}
   */
  this.restartTimer = null;
}

Node.prototype.added = function()
{
  console.log('[%s] added. Mask=%d Sees=[%s]', this.id, this.mask, this.sees.join(', '));

  this.startProcess();
};

Node.prototype.removed = function()
{
  console.log('[%s] removed.', this.id);

  this.stopProcess();
};

/**
 * @param {Node} newNode
 */
Node.prototype.updated = function(newNode)
{
  console.log('[%d] updated. Mask changed from %d to %d', this.id, this.mask, newNode.mask);

  this.sees = newNode.sees;
  this.mask = newNode.mask;

  this.restartProcess();
};

/**
 * @private
 */
Node.prototype.startProcess = function(done)
{
  clearTimeout(this.restartTimer);
  this.restartTimer = null;

  if (this.process !== null)
  {
    return done();
  }

  var isCoordinator = this.id === coordinatorId;
  var args = isCoordinator ? [].concat(coordinatorArgs) : [];

  args.push('-c', this.id, '-m', this.mask);

  this.process = childProcess.spawn(emulProcessFile, args);

  var node = this;

  this.process.on('exit', function(code, signal)
  {
    code = Number(code);

    if (code !== 0 || signal !== 'SIGINT')
    {
      console.log('[%s] process killed. Code=%d Signal=%s', node.id, code, signal);

      node.restartTimer = setTimeout(node.startProcess.bind(node), Math.floor(Math.random() * 1000) + 1000);
    }

    node.process = null;
  });

  if (cpuLimit !== -1)
  {
    this.startCpuLimiter();
  }

  return done && done();
};

/**
 * @private
 */
Node.prototype.stopProcess = function(done)
{
  clearTimeout(this.restartTimer);
  this.restartTimer = null;

  if (this.process === null)
  {
    return done && done();
  }

  if (done)
  {
    this.process.on('exit', done);
  }

  this.process.kill('SIGINT');
};

/**
 * @private
 */
Node.prototype.restartProcess = function(done)
{
  var node = this;

  this.stopProcess(function()
  {
    node.startProcess(done);
  });
};

/**
 * @private
 */
Node.prototype.startCpuLimiter = function()
{
  var node = this;
  var args = [
    '-z',
    '-p', this.process.pid.toString(),
    '-l', cpuLimit.toString()
  ];

  this.cpuLimitProcess = childProcess.spawn('cpulimit', args);
  this.cpuLimitProcess.on('exit', function()
  {
    node.cpuLimitProcess = null;
  });
};

/**
 * @constructor
 */
function EmulDataDiff()
{
  /**
   * @type {Array.<Node>}
   */
  this.added = [];

  /**
   * @type {Array.<Number>}
   */
  this.removed = [];

  /**
   * @type {Object.<Number, Node>}
   */
  this.updated = {};
}

for (var i = 0, l = process.argv.length; i < l; ++i)
{
  var name = process.argv[i++];
  var value = process.argv[i];

  if (typeof value === 'undefined')
  {
    break;
  }

  switch (name)
  {
    case '-T':
    case '-r':
    case '-e':
      coordinatorArgs.push(name, value);
      break;

    case '-c':
      if (/^[0-9]+$/.test(value))
      {
        coordinatorId = parseInt(value);
      }
      break;

    case '-p':
      emulProcessFile = value;
      break;

    case '-f':
      emulDataFile = value;
      break;

    case '-l':
      if (value > 0 && value < 100)
      {
        cpuLimit = parseInt(value);
      }
      break;
  }
}

for (name in DEFAULT_COORDINATOR_ARGS)
{
  if (DEFAULT_COORDINATOR_ARGS.hasOwnProperty(name) && coordinatorArgs.indexOf(name) === -1)
  {
    coordinatorArgs.push(name, DEFAULT_COORDINATOR_ARGS[name]);
  }
}

parseEmulDataFile();

fs.watchFile(emulDataFile, {persistent: true, interval: 1000}, function(curr, prev)
{
  if (curr.mtime > prev.mtime)
  {
    parseEmulDataFile();
  }
});

console.log('Watching emulation data file for changes...');
