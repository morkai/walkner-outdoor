define(
[
  'require',
  'jQuery',
  'Underscore',
  'Backbone',
  'moment',

  'app/time',
  'app/socket',
  'app/views/viewport',

  'text!app/templates/diag/graph.html'
],
/**
 * @param {Function} require
 * @param {jQuery} $
 * @param {Underscore} _
 * @param {Backbone} Backbone
 * @param {moment} moment
 * @param {Object} time
 * @param {io.SocketNamespace} socket
 * @param {Viewport} viewport
 * @param {String} graphTpl
 */
function(
  require,
  $,
  _,
  Backbone,
  moment,
  time,
  socket,
  viewport,
  graphTpl)
{
  var NODE_TYPE_TO_SYMBOL = {
    'controller': 'circle',
    'zone': 'square'
  };

  /**
   * @class GraphView
   * @constructor
   * @extends Backbone.View
   * @param {Object} [options]
   */
  var GraphView = Backbone.View.extend({
    template: _.template(graphTpl),
    className: 'graphContainer',
    topics: {
      'controller timed': 'onControllerTime',
      'controller started': 'onControllerStart',
      'controller stopped': 'onControllerStop',
      'controller added': 'addController',
      'controller removed': 'removeController',
      'zone started': 'onZoneStart',
      'zone stopped': 'onZoneStop',
      'zone state changed': 'onZoneStateChange',
      'zone added': 'addZone',
      'zone removed': 'removeZone',
      'devscan': 'onDevscan'
    },
    events: {
      'click .devscan': 'devscan'
    }
  });

  GraphView.prototype.initialize = function()
  {
    _.bindAll.apply(null, [this].concat(_.values(this.topics)));

    for (var topic in this.topics)
    {
      socket.on(topic, this[this.topics[topic]]);
    }

    this.restart = _.debounce(_.bind(this.restart, this), 250);

    this.devscanXhr = null;
    this.devscanTimer = null;
    this.devscanVersion = 0;

    this.pingToDistance = true;
    this.vis = null;
    this.force = null;
    this.nodes = [];
    this.links = [];
  };

  GraphView.prototype.destroy = function()
  {
    if (this.devscanXhr !== null)
    {
      this.devscanXhr.abort();
    }

    clearTimeout(this.devscanTimer);
    this.devscanTimer = null;

    for (var topic in this.topics)
    {
      socket.removeListener(topic, this[this.topics[topic]]);
    }
    
    this.remove();
  };

  GraphView.prototype.render = function()
  {
    this.el.innerHTML = this.template();

    var graphView = this;

    require(['/vendor/d3-min.js'], function()
    {
      var $graph = graphView.$('.graph').first();
      var w = $graph.width();
      var h = $graph.height();

      if (window.innerHeight > h)
      {
        h = window.innerHeight;
      }

      graphView.setUpVis($graph[0], w, h);
      graphView.setUpForce([w, h]);

      graphView.model.controllers.forEach(graphView.addController);
      graphView.model.zones.forEach(graphView.addZone);

      graphView.devscan();
    });

    return this;
  };

  GraphView.prototype.devscan = function()
  {
    if (this.devscanXhr !== null)
    {
      return;
    }

    clearTimeout(this.devscanTimer);
    this.devscanTimer = null;

    var $devscanAction = this.$('.action.devscan').attr('disabled', true);

    var graphView = this;

    this.devscanXhr = $.ajax({
      url: '/diag/devscan',
      success: function(res)
      {
        if (!res.success)
        {
          return;
        }

        graphView.onDevscan(res.result);
      },
      complete: function()
      {
        graphView.devscanXhr = null;
        graphView.devscanTimer = setTimeout(function() { graphView.devscan(); }, 30000);

        $devscanAction.removeAttr('disabled');
      }
    });
  };

  /**
   * @private
   * @param {Object} result
   */
  GraphView.prototype.onDevscan = function(result)
  {
    var graphView = this;

    if (result.version === graphView.devscanVersion)
    {
      return;
    }

    graphView.devscanVersion = result.version;

    var devscanLinks = result.links.map(function(link)
    {
      link.source = graphView.getNodeIndexById(link.source);
      link.target = graphView.getNodeIndexById(link.target);
      link.type = 'devscan';

      return link;
    }).filter(function(link)
    {
      return link.source !== -1 && link.target !== -1;
    });

    graphView.links = graphView.links.filter(function(link)
    {
      return link.type !== 'devscan';
    });
    graphView.links = graphView.links.concat(devscanLinks);

    graphView.restartLinks(true);
  };

  /**
   * @private
   * @param {HTMLElement} el
   * @param {Number} w
   * @param {Number} h
   */
  GraphView.prototype.setUpVis = function(el, w, h)
  {
    var vis = d3.select(el)
      .attr('width', w)
      .attr('height', h)
      .append('svg:g')
        .call(d3.behavior.zoom().on('zoom', zoom))
      .append('svg:g');

    vis.append('svg:rect')
      .attr('width', w * 3)
      .attr('height', h * 3)
      .attr('fill', 'transparent');

    var graphView = this;

    function zoom()
    {
      vis.attr('transform', 'translate(' + d3.event.translate + ') scale(' + d3.event.scale + ')');

      if (d3.event.scale >= .7)
      {
        graphView.$('text').fadeIn();
      }
      else
      {
        graphView.$('text').fadeOut();
      }
    }

    this.vis = vis;
  };

  /**
   * @private
   * @param {Array.<Number>} size
   */
  GraphView.prototype.setUpForce = function(size)
  {
    var force = d3.layout.force()
      .gravity(.025)
      .distance(function(d) { return d.distance || 100; })
      .charge(-125)
      .size(size);

    var vis = this.vis;

    force.on('tick', function()
    {
      vis.selectAll('line.link')
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

      vis.selectAll('g.node')
        .attr('transform', function(d) { return 'translate(' + d.x + ',' + d.y + ')'; });
    });

    this.force = force;
  };

  /**
   * @private
   * @param {Object} d
   * @return {String}
   */
  GraphView.prototype.getNodeClassNames = function(d)
  {
    var classNames = ['node'];

    classNames.push(d.type);

    if (d.data.available)
    {
      classNames.push('available');
    }
    else if (d.data.online)
    {
      classNames.push('online');
    }

    switch (d.type)
    {
      case 'zone':
        classNames.push(d.data.state);
        break;

      case 'controller':
        break;
    }

    return classNames.join(' ');
  };

  GraphView.prototype.enterNodes = function(nodes)
  {
    var node = nodes.enter().append('svg:g')
      .attr('class', this.getNodeClassNames)
      .call(this.force.drag);

    var symbol = d3.svg.symbol()
      .size(800)
      .type(function(d) { return NODE_TYPE_TO_SYMBOL[d.type]; });

    node.append('svg:path')
      .attr('d', symbol);

    node.append('svg:text')
      .attr('x', 20)
      .attr('y', 4)
      .text(function(d) { return d.name; });
  };

  GraphView.prototype.updateNodes = function(nodes)
  {
    nodes.attr('class', this.getNodeClassNames);

    nodes.selectAll('text')
      .text(function(d) { return d.name; });
  };

  GraphView.prototype.exitNodes = function(nodes)
  {
    nodes.exit().remove();
  };

  /**
   * @private
   */
  GraphView.prototype.restart = function()
  {
    this.restartLinks();
    this.restartNodes();
    this.restartForce();
  };

  /**
   * @private
   * @param {Boolean} restartForce
   */
  GraphView.prototype.restartLinks = function(restartForce)
  {
    var links = this.vis.selectAll('line.link')
      .data(this.links, function(d) { return d.source.id + '-' + d.target.id; });

    links.enter().insert('svg:line', 'g.node')
      .attr('class', 'link')
      .attr('x1', function(d) { return d.source.x; })
      .attr('y1', function(d) { return d.source.y; })
      .attr('x2', function(d) { return d.target.x; })
      .attr('y2', function(d) { return d.target.y; });

    links.exit().remove();

    if (restartForce)
    {
      this.restartForce();
    }
  };

  /**
   * @private
   * @param {Boolean} restartForce
   */
  GraphView.prototype.restartNodes = function(restartForce)
  {
    var nodes = this.vis.selectAll('g.node')
      .data(this.nodes, function(d) { return d.id; });

    this.updateNodes(nodes);
    this.enterNodes(nodes);
    this.exitNodes(nodes);

    if (restartForce)
    {
      this.restartForce();
    }
  };

  /**
   * @private
   */
  GraphView.prototype.restartForce = function()
  {
    this.force
      .nodes(this.nodes)
      .links(this.links)
      .start();
  };

  /**
   * @private
   * @param {Object} controller
   */
  GraphView.prototype.addController = function(controller)
  {
    var node = {
      id: controller._id,
      name: controller.name,
      type: 'controller',
      data: controller
    };

    this.nodes.push(node);

    this.restartNodes(true);
  };

  /**
   * @private
   * @param {String} controllerId
   */
  GraphView.prototype.removeController = function(controllerId)
  {
    this.removeNode(controllerId);
  };

  /**
   * @private
   * @param {Object} zone
   */
  GraphView.prototype.addZone = function(zone)
  {
    var node = {
      id: zone._id,
      name: zone.name,
      type: 'zone',
      data: zone
    };

    this.nodes.push(node);

    var controllerId = !zone.controller
      ? null
      : _.isString(zone.controller)
        ? zone.controller
        : zone.controller._id;

    if (_.isString(controllerId))
    {
      var zoneIdx = this.nodes.length - 1;
      var controllerIdx = -1;

      for (var i = 0, l = this.nodes.length; i < l; ++i)
      {
        if (this.nodes[i].type === 'controller' && this.nodes[i].data._id === controllerId)
        {
          controllerIdx = i;

          break;
        }
      }

      if (controllerIdx !== -1)
      {
        this.links.push({
          source: controllerIdx,
          target: zoneIdx,
          type: 'zone'
        });

        this.restart();
      }
      else
      {
        this.restartNodes(true);
      }
    }
    else
    {
      this.restartNodes(true);
    }
  };

  /**
   * @private
   * @param {String} zoneId
   */
  GraphView.prototype.removeZone = function(zoneId)
  {
    this.removeNode(zoneId);
  };

  /**
   * @private
   * @param {String} nodeId
   */
  GraphView.prototype.removeNode = function(nodeId)
  {
    var node = this.getNodeById(nodeId);

    if (!node)
    {
      return;
    }

    var nodeIdx = this.nodes.indexOf(node);

    this.nodes.splice(nodeIdx, 1);

    var linksToRemove = this.getLinksById(nodeId);

    if (linksToRemove.length > 0)
    {
      this.links = _.without(this.links, linksToRemove);

      this.restart();
    }
    else
    {
      this.restartNodes(false);
    }
  };

  /**
   * @private
   * @param {String} id
   * @return {Number}
   */
  GraphView.prototype.getNodeIndexById = function(id)
  {
    for (var i = 0, l = this.nodes.length; i < l; ++i)
    {
      if (this.nodes[i].id === id)
      {
        return i;
      }
    }

    return -1;
  };

  /**
   * @private
   * @param {String} id
   * @return {?Object}
   */
  GraphView.prototype.getNodeById = function(id)
  {
    return _.find(this.nodes, function(node) { return node.id === id; });
  };

  /**
   * @private
   * @param {String} id
   * @param {String} [property]
   * @return {Array.<Object>}
   */
  GraphView.prototype.getLinksById = function(id, property)
  {
    var both = _.isUndefined(property);

    return this.links.filter(function(link)
    {
      if (both)
      {
        return link.target.id === id || link.source === id;
      }

      return link[property].id === id;
    });
  };

  /**
   * @private
   * @param {String} controllerId
   */
  GraphView.prototype.onControllerStart = function(controllerId)
  {
    var controllerNode = this.getNodeById(controllerId);

    controllerNode.data.available = false;

    this.restartNodes(false);
  };

  /**
   * @private
   * @param {String} controllerId
   */
  GraphView.prototype.onControllerStop = function(controllerId)
  {
    var controllerNode = this.getNodeById(controllerId);

    controllerNode.data.available = false;

    this.restartNodes(false);
  };

  /**
   * @private
   * @param {Object} data
   */
  GraphView.prototype.onControllerTime = function(data)
  {
    var controllerNode = this.getNodeById(data.controllerId);

    if (!controllerNode.data.available)
    {
      controllerNode.data.available = true;

      this.restartNodes(false);
    }

    var links = this.getLinksById(data.controllerId, 'source');

    if (links.length === 0)
    {
      return;
    }

    var changed = false;
    var newDistance = this.getDistanceFromPing(data.results.last);

    links.forEach(function(link)
    {
      if (newDistance !== link.distance)
      {
        changed = true;
        link.distance = newDistance;
      }
    });

    if (changed)
    {
      this.restartLinks(true);
    }
  };

  /**
   * @private
   * @param {Object} data
   */
  GraphView.prototype.onZoneStateChange = function(data)
  {
    var zoneNode = this.getNodeById(data._id);

    if (!zoneNode)
    {
      return;
    }

    this.restartNodes(false);
  };

  /**
   * @private
   * @param {Object} zone
   */
  GraphView.prototype.onZoneStart = function(zone)
  {
    var zoneNode = this.getNodeById(zone._id);

    if (!zoneNode)
    {
      return;
    }

    zoneNode.data.available = false;

    this.restartNodes(false);
  };

  /**
   * @private
   * @param {String} zoneId
   */
  GraphView.prototype.onZoneStop = function(zoneId)
  {
    var zoneNode = this.getNodeById(zoneId);

    if (!zoneNode)
    {
      return;
    }

    zoneNode.data.available = false;

    this.restartNodes(false);
  };

  /**
   * @private
   * @param {?Number} ping
   * @return {Number}
   */
  GraphView.prototype.getDistanceFromPing = function(ping)
  {
    var minPing = 100;
    var maxPing = 500;
    var minDistance = 100;
    var maxDistance = 250;

    if (!this.pingToDistance)
    {
      return minDistance;
    }

    ping = Math.min(maxPing, Math.max(minPing, ping || 0));

    var pingPercent = ((ping - minPing) * 100 / (maxPing - minPing)) / 100;
    var distance = maxDistance * pingPercent;

    return distance < minDistance ? minDistance : distance;
  };
  
  return GraphView;
});
