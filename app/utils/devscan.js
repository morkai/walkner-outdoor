// Copyright (c) 2014, Łukasz Walukiewicz <lukasz@walukiewicz.eu>. Some Rights Reserved.
// Licensed under CC BY-NC-SA 4.0 <http://creativecommons.org/licenses/by-nc-sa/4.0/>.
// Part of the walkner-outdoor project <http://lukasz.walukiewicz.eu/p/walkner-outdoor>

var net = require('net');
var parseUrl = require('url').parse;
var format = require('util').format;
var _ = require('underscore');
var exec = require('../utils/exec');
var diagConfig = require('../../config/diag');

var libcoapConfig = null;
var cfProxyConfig = null;
var cfProxy;

var devscanRegExp = new RegExp('\\[([0-9a-f:]+)\\]via\\[([0-9a-f:]+)\\]', 'g');
var macFromIpRegExp = /^[0-9a-f]{4}:[0-9a-f]{4}:[0-9a-f]{4}:[0-9a-f]{4}:([0-9a-f]{2})([0-9a-f]{2}):([0-9a-f]{2})[0-9a-f]{2}:[0-9a-f]{2}([0-9a-f]{2}):([0-9a-f]{2})([0-9a-f]{2})$/;

var scansInProgress = -1;
var scanQueue;
var macToIdMap;
var macToIpMap;
var devscanResults;
var nodes;
var links;

exports.lastResult = {
  version: Date.now(),
  links: [],
  nodes: []
};

var coordinatorIp = expandIpv6(diagConfig.coordinatorIp);
var coordinatorMac = extractMacFromIpv6(coordinatorIp);

exports.scan = function(done)
{
  if (!coordinatorIp)
  {
    return done(new Error("Device scanning is disabled."));
  }

  done(null, exports.lastResult);

  if (scansInProgress !== -1)
  {
    return;
  }

  scansInProgress = 0;
  scanQueue = [];
  macToIdMap = {};
  macToIpMap = {};
  devscanResults = {};

  app.db.model('Controller').find({type: diagConfig.coordinatorType}, {connectionInfo: 1}, function(err, controllers)
  {
    if (err)
    {
      console.error(
        '[devscan] Failed to retrieve the %s controllers: %s',
        diagConfig.coordinatorType,
        err.message
      );

      scansInProgress = -1;

      return;
    }

    controllers.forEach(function(controller)
    {
      var mac;

      if (_.isString(controller.connectionInfo.ip))
      {
        mac = extractMacFromIpv6(controller.connectionInfo.ip);
      }
      else if (_.isString(controller.connectionInfo.uri))
      {
        mac = extractMacFromUri(controller.connectionInfo.uri);
      }
      else
      {
        return;
      }

      macToIdMap[mac] = controller.id;
    });

    scanQueue.push(coordinatorIp);

    execNextDevscan();
  });
};

function execNextDevscan()
{
  if (scanQueue.length === 0 && scansInProgress === 0)
  {
    return process.nextTick(analyzeDevscanResults);
  }

  var ip = expandIpv6(scanQueue.shift());

  if (ip in devscanResults)
  {
    return process.nextTick(execNextDevscan);
  }

  devscanResults[ip] = null;

  switch (diagConfig.coordinatorType)
  {
    case 'cf-proxy-08':
      execCfProxy80DevScan(ip);
      break;

    case 'libcoap':
    case 'remote-libcoap':
      execLibcoapDevscan(ip);
      break;
  }
}

/**
 * @param {String} ip
 */
function execLibcoapDevscan(ip)
{
  if (libcoapConfig === null)
  {
    libcoapConfig = require('../../config/libcoap');
  }

  var cmd = format('%s -o - "coap://[%s]/devscan"', libcoapConfig.coapClientPath, ip);
  var options = {timeout: libcoapConfig.coapClientTimeout};

  ++scansInProgress;

  exec(cmd, options, function(err, stdout)
  {
    --scansInProgress;

    if (err)
    {
      console.error("[devscan] Failed to scan the [%s] controller: %s", ip, err.message);
    }
    else
    {
      devscanResults[ip] = parseDevscanPayload(stdout.toString());
    }

    process.nextTick(execNextDevscan);
  });
}

/**
 * @param {String} ip
 */
function execCfProxy80DevScan(ip)
{
  if (cfProxyConfig === null)
  {
    cfProxyConfig = require('../../config/cf-proxy');
    cfProxy = new (require('californium-proxy').Proxy)({
      host: cfProxyConfig.host,
      port: cfProxyConfig.port,
      reconnect: true,
      maxReconnectDelay: 5000
    });
  }

  var req = cfProxy.request({
    type: 'non',
    code: 'get',
    options: {
      proxyUri: 'coap://[' + ip + ']',
      uriPath: '/devscan'
    }
  });

  req.on('error', function(err)
  {
    console.error("[devscan] Failed to scan the [%s] controller: %s", ip, err.message);

    process.nextTick(execNextDevscan);
  });

  req.on('response', function(res)
  {
    devscanResults[ip] = parseDevscanPayload(res.getPayload().toString());

    process.nextTick(execNextDevscan);
  });
}

/**
 * @param {String} ip
 * @param {String} mac
 * @return {String}
 */
function getNodeId(ip, mac)
{
  if (mac in macToIdMap)
  {
    return macToIdMap[mac];
  }

  var id = ip.replace(/:/g, '');

  macToIdMap[mac] = id;

  nodes.push({
    id: id,
    name: mac,
    type: 'controller',
    devscan: true,
    data: {}
  });

  return id;
}

function analyzeDevscanResults()
{
  nodes = [];
  links = [];

  var coordinatorId = getNodeId(coordinatorIp, coordinatorMac);
  var coordinatorDevscan = devscanResults[coordinatorIp];

  for (var dstMac in coordinatorDevscan)
  {
    var dstIp = macToIpMap[dstMac];
    var dstId = getNodeId(dstIp, dstMac);
    var hopMac = coordinatorDevscan[dstMac];
    var hopId;

    if (hopMac === null)
    {
      hopId = coordinatorId;
    }
    else
    {
      hopId = findLastHopId(dstMac, hopMac);
    }

    if (hopId === null)
    {
      continue;
    }

    links.push({
      source: dstId,
      target: hopId,
      devscan: true
    });
  }

  exports.lastResult.version = Date.now();
  exports.lastResult.nodes = nodes;
  exports.lastResult.links = links;

  app.io.sockets.emit('devscan', exports.lastResult);

  scansInProgress = -1;
  scanQueue = null;
  macToIdMap = null;
  macToIpMap = null;
  devscanResults = null;
  nodes = null;
  links = null;
}

function findLastHopId(dstMac, hopMac)
{
  var hopIp = macToIpMap[hopMac];

  if (typeof hopIp === 'undefined')
  {
    console.error('hopIp undefined for dstMac=%s hopMac=%s', dstMac, hopMac);

    return null;
  }

  var hopId = getNodeId(hopIp, hopMac);
  var hopDevscan = devscanResults[hopIp];

  if (typeof hopDevscan === 'undefined' || hopDevscan === null)
  {
    return hopId;
  }

  var nextHopMac = hopDevscan[dstMac];

  if (typeof nextHopMac === 'undefined' || nextHopMac === null)
  {
    return hopId;
  }

  return findLastHopId(dstMac, nextHopMac);
}

/**
 * @param {String} payload
 * @return {Object.<String, ?String>}
 */
function parseDevscanPayload(payload)
{
  var devscanResult = {};

  if (payload.length === 0)
  {
    return devscanResult;
  }

  var match;

  while ((match = devscanRegExp.exec(payload)) !== null)
  {
    var dstIp = expandIpv6(match[1]);
    var hopIp = expandIpv6(match[2]);
    var dstMac = extractMacFromIpv6(dstIp);
    var hopMac = extractMacFromIpv6(hopIp);

    macToIpMap[dstMac] = dstIp;

    if (dstMac === hopMac)
    {
      devscanResult[dstMac] = null;
    }
    else
    {
      devscanResult[dstMac] = hopMac;
    }

    scanQueue.push(dstIp);
  }

  return devscanResult;
}

function extractMacFromUri(uri)
{
  return extractMacFromIpv6(parseUrl(uri).hostname);
}

/**
 * @param {?String} address
 * @return {?String}
 * @see http://forrst.com/posts/JS_Expand_Abbreviated_IPv6_Addresses-1OR
 */
function expandIpv6(address)
{
  if (typeof address !== 'string')
  {
    return null;
  }

  if (address.length === 39)
  {
    return address;
  }

  var validGroupCount = 8;
  var validGroupSize = 4;
  var fullAddress;
  var i;
  var l;

  if (address.indexOf('::') === -1)
  {
    fullAddress = address;
  }
  else
  {
    var sides = address.split('::');
    var groupsPresent = 0;

    for (i = 0, l = sides.length; i < l; ++i)
    {
      groupsPresent += sides[i].split(':').length;
    }

    fullAddress = sides[0] + ':';

    for (i = 0, l = validGroupCount - groupsPresent; i < l; ++i)
    {
      fullAddress += '0000:';
    }

    fullAddress += sides[1];
  }

  var groups = fullAddress.split(':');

  if (groups.length !== validGroupCount)
  {
    return null;
  }

  var expandedAddress = '';
  var lastGroupIndex = validGroupCount - 1;

  for (i = 0; i < validGroupCount; ++i)
  {
    while (groups[i].length < validGroupSize)
    {
      groups[i] = '0' + groups[i];
    }

    expandedAddress += groups[i];

    if (i !== lastGroupIndex)
    {
      expandedAddress += ':';
    }
  }

  return expandedAddress.toLowerCase();
}

/**
 * @param {?String} ip
 * @return {?String}
 */
function extractMacFromIpv6(ip)
{
  ip = expandIpv6(ip);

  if (ip === null)
  {
    return null;
  }

  var parts = ip.match(macFromIpRegExp);

  parts.shift();

  parts[0] = (parseInt(parts[0], 16) ^ 2).toString(16);

  if (parts[0].length === 1)
  {
    parts[0] = '0' + parts[0];
  }

  return parts.join(':');
}
