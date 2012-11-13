var parseUrl = require('url').parse;
var format = require('util').format;
var _ = require('underscore');
var exec = require('../utils/exec');
var diagConfig = require('../../config/diag');
var libcoapConfig = require('../../config/libcoap');

var devscanRegExp = new RegExp('\\[([0-9a-f:]+)\\]via\\[([0-9a-f:]+)\\]', 'g');
var macFromIpRegExp = /^[0-9a-f]{4}:[0-9a-f]{4}:[0-9a-f]{4}:[0-9a-f]{4}:([0-9a-f]{2})([0-9a-f]{2}):([0-9a-f]{2})[0-9a-f]{2}:[0-9a-f]{2}([0-9a-f]{2}):([0-9a-f]{2})([0-9a-f]{2})$/;
var lastDevscanPayload = null;

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
    return done("Device scanning is disabled.");
  }

  var cmd = format('%s -o - "coap://[%s]/devscan"', libcoapConfig.coapClientPath, coordinatorIp);
  var options = {
    timeout: libcoapConfig.coapClientTimeout
  };

  app.db.model('Controller').find({type: 'remote-libcoap'}, {connectionInfo: 1}, function(err, controllers)
  {
    if (err)
    {
      return done(err);
    }

    var macToIdMap = {};

    controllers.forEach(function(controller)
    {
      macToIdMap[extractMacFromUri(controller.connectionInfo.uri)] = controller.id;
    });

    exec(cmd, options, function(err, stdout)
    {
      if (err)
      {
        return done(err);
      }

      var currentPayload = stdout.toString();

      if (currentPayload === lastDevscanPayload)
      {
        return done(null, exports.lastResult);
      }

      lastDevscanPayload = currentPayload;

      parseLastDevscanPayload(macToIdMap);

      app.io.sockets.emit('devscan', exports.lastResult);

      return done(null, exports.lastResult);
    });
  });
};

function parseLastDevscanPayload(macToIdMap)
{
  var match;
  var links = [];
  var nodes = [];

  function addUnknownNode(ip, mac)
  {
    var id = ip.replace(/\.|:/g, '');

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

  while ((match = devscanRegExp.exec(lastDevscanPayload)) !== null)
  {
    var sourceIp = expandIpv6(match[1]);
    var targetIp = expandIpv6(match[2]);
    var sourceMac = extractMacFromIpv6(sourceIp);
    var targetMac = extractMacFromIpv6(targetIp);

    if (targetMac === sourceMac)
    {
      targetIp = coordinatorIp;
      targetMac = coordinatorMac;
    }

    var sourceId = macToIdMap[sourceMac];
    var targetId = macToIdMap[targetMac];

    if (_.isUndefined(sourceId))
    {
      sourceId = addUnknownNode(sourceIp, sourceMac);
    }

    if (_.isUndefined(targetId))
    {
      targetId = addUnknownNode(targetIp, targetMac);
    }

    links.push({
      source: sourceId,
      target: targetId,
      devscan: true
    });
  }

  exports.lastResult.version = Date.now();
  exports.lastResult.links = links;
  exports.lastResult.nodes = nodes;
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
