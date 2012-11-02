var parseUrl = require('url').parse;
var format = require('util').format;
var _ = require('underscore');
var exec = require('../utils/exec');
var diagConfig = require('../../config/diag');
var libcoapConfig = require('../../config/libcoap');

var devscanRegExp = new RegExp('\\[([0-9a-f:]+)\\]via\\[([0-9a-f:]+)\\]', 'g');
var macFromIpRegExp = /^[0-9a-f]{4}::2([0-9a-f]{2}):([0-9a-f]{2})ff:fe([0-9a-f]{2}):([0-9a-f]{2})([0-9a-f]{2})/i;
var lastDevscanPayload = null;

exports.lastResult = {
  version: Date.now(),
  links: [],
  nodes: []
};

exports.scan = function(done)
{
  var coordinatorIp = diagConfig.coordinatorIp;

  if (!diagConfig.coordinatorIp)
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
    var sourceIp = match[1];
    var targetIp = match[2];
    var sourceMac = extractMacFromIp(sourceIp);
    var targetMac = extractMacFromIp(targetIp);

    if (targetMac === sourceMac)
    {
      targetMac = extractMacFromIp(diagConfig.coordinatorIp);
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

function extractMacFromIp(ip)
{
  var parts = ip.match(macFromIpRegExp);

  parts.shift();

  return '00:' + parts.join(':');
}

function extractMacFromUri(uri)
{
  return extractMacFromIp(parseUrl(uri).hostname);
}

function broadcastLinkDifference(oldLinks)
{

}
