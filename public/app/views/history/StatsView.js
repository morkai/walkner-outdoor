define(
[
  'jQuery',
  'Underscore',
  'Backbone',
  'moment',

  'app/time',
  'app/models/HistoryEntry',
  'app/views/viewport',
  'app/views/PageLayout',

  'text!app/templates/history/stats.html',

  'vendor/jqplot/jquery.jqplot.min.js'
],
/**
 * @param {jQuery} $
 * @param {Underscore} _
 * @param {Backbone} Backbone
 * @param {moment} moment
 * @param {Object} time
 * @param {function(new:HistoryEntry)} HistoryEntry
 * @param {Viewport} viewport
 * @param {function(new:PageLayout)} PageLayout
 * @param {String} statsTpl
 */
function(
  $,
  _,
  Backbone,
  moment,
  time,
  HistoryEntry,
  viewport,
  PageLayout,
  statsTpl)
{
  var FINISH_STATES = {
    finish: 0,
    stop: 1,
    error: 2
  };

  var SERIES_COLORS = ['#5AAB25', '#F0A000', '#FF3A3A'];

  var PIXELS_PER_Y = 40;

  /**
   * @class StatsView
   * @constructor
   * @extends Backbone.View
   * @param {Object} [options]
   */
  var StatsView = Backbone.View.extend({
    helpHash: 'stats-view',
    className: 'stats',
    template: _.template(statsTpl),
    layout: PageLayout,
    breadcrumbs: function()
    {
      return [
        {href: '#history', text: 'Historia'},
        'Statystyki'
      ];
    },
    events: {
      'click .goToChart a': 'goToChart',
      'click .reload': 'reload'
    }
  });

  StatsView.prototype.initialize = function()
  {
    _.bindAll(this, 'showTooltip', 'resizePlots');

    this.resizePlots = _.debounce(this.resizePlots, 250);

    this.plots = {
      programTimes: null,
      programCounts: null,
      zoneTimes: null
    };

    this.$tooltip = null;
    this.lastSeriesIndex = -1;
    this.lastPointIndex = -1;
    this.topOffset = 0;
    this.leftOffset = 0;

    this.from = '';
    this.to = '';
  };

  StatsView.prototype.destroy = function()
  {
    this.destroyPlots();
    this.remove();
  };

  StatsView.prototype.render = function()
  {
    this.el.innerHTML = this.template(this.getTemplateData());

    this.$tooltip = this.$('.tooltip').show();

    var self = this;

    _.defer(function()
    {
      self.topOffset = -self.$tooltip.outerHeight(true) - 10;
      self.$tooltip.hide();

      self.renderDateChart('dateTimes');
      self.renderTimesChart('programTimes');
      self.renderCountsChart('programCounts');
      self.renderTimesChart('zoneTimes');
    });

    $(window).on('resize', this.resizePlots);

    return this;
  };

  /**
   * @private
   */
  StatsView.prototype.reload = function()
  {
    viewport.msg.loading();

    this.from = this.$('#stats-range-from').val();
    this.to = this.$('#stats-range-to').val();

    this.$('input.reload').attr('disabled', true);

    var me = this;

    $.ajax({
      url: '/history;stats',
      data: {
        from: new Date(this.from).getTime(),
        to: new Date(this.to).getTime()
      },
      success: function(stats)
      {
        me.model = stats;

        me.destroyPlots();
        $(me.el).empty();
        me.render();

        viewport.msg.hide();
      },
      error: function()
      {
        viewport.msg.show({
          type: 'error',
          text: 'Nie udało się zmienić zakresu :('
        });
      }
    });
  };

  /**
   * @private
   */
  StatsView.prototype.destroyPlots = function()
  {
    $(window).off('resize', this.resizePlots);

    for (var plotName in this.plots)
    {
      if (!this.plots.hasOwnProperty(plotName) || !this.plots[plotName])
      {
        continue;
      }

      this.plots[plotName].destroy();
      this.plots[plotName] = null;
    }
  };

  /**
   * @private
   * @return {Object}
   */
  StatsView.prototype.getTemplateData = function()
  {
    var stats = this.model;
    var data = {
      from: this.from,
      to: this.to
    };

    data.totalRunPrograms = stats.programCounts.$total.$total;
    data.totalFinishedPrograms = stats.programCounts.$total.finish;
    data.totalStoppedPrograms = stats.programCounts.$total.stop;
    data.totalErroredPrograms = stats.programCounts.$total.error;

    data.totalTime = time.toString(stats.programTimes.$total.$total);
    data.totalFinishedTime = time.toString(stats.programTimes.$total.finish);
    data.totalStoppedTime = time.toString(stats.programTimes.$total.stop);
    data.totalErroredTime = time.toString(stats.programTimes.$total.error);

    data.topCountProgram = this.getTopEntry(stats.programCounts);
    data.bottomCountProgram = this.getBottomEntry(stats.programCounts);
    data.topTimeProgram = this.getTopEntry(stats.programCounts, time.toString);
    data.topTimeZone = this.getTopEntry(stats.zoneTimes, time.toString);
    data.bottomTimeZone = this.getBottomEntry(stats.zoneTimes, time.toString);
    data.topErrorProgram = this.getEntry(
      stats.programCounts, function(a, b)
      {
        return a.error + a.stop > b.error + b.stop;
      }
    );

    return data;
  };

  /**
   * @private
   * @param {Object} entries
   * @param {Function} comparator
   * @param {?Function} [formatter]
   * @return {Object}
   */
  StatsView.prototype.getEntry = function(entries, comparator, formatter)
  {
    formatter || (formatter = function(val) { return val; });

    var entry;
    var entryId;

    for (var id in entries)
    {
      if (!entries.hasOwnProperty(id) || id[0] === '$')
      {
        continue;
      }

      if (!entry || comparator(entries[id], entry))
      {
        entry = entries[id];
        entryId = id;
      }
    }

    if (typeof entry === 'undefined')
    {
      return {};
    }

    return {
      _id: entryId,
      name: this.model.idToNameMap[entryId],
      total: formatter(entry.$total),
      finished: formatter(entry.finish),
      stopped: formatter(entry.stop),
      errored: formatter(entry.error)
    };
  };

  /**
   * @private
   * @param {Object} entries
   * @param {?Function} [formatter]
   * @return {Object}
   */
  StatsView.prototype.getTopEntry = function(entries, formatter)
  {
    function comparator(a, b)
    {
      return a.$total > b.$total;
    }

    return this.getEntry(entries, comparator, formatter);
  };

  /**
   * @private
   * @param {Object} entries
   * @param {?Function} [formatter]
   * @return {Object}
   */
  StatsView.prototype.getBottomEntry = function(entries, formatter)
  {
    function comparator(a, b)
    {
      return a.$total < b.$total;
    }

    return this.getEntry(entries, comparator, formatter);
  };

  /**
   * @private
   * @param {Object} e
   */
  StatsView.prototype.goToChart = function(e)
  {
    var chartType = $(e.target).attr('data-type');
    var $chartContainer = $('.chartContainer[data-type="' + chartType + '"]');

    window.scrollTo(0, $chartContainer.position().top);
  };

  /**
   * @private
   */
  StatsView.prototype.resizePlots = function()
  {
    for (var plotName in this.plots)
    {
      if (!this.plots.hasOwnProperty(plotName))
      {
        continue;
      }

      var plot = this.plots[plotName];

      if (plot)
      {
        plot.replot({resetAxes: true});
      }
    }
  };

  /**
   * @private
   */
  StatsView.prototype.renderTimesChart = function(type)
  {
    var labels = [];
    var data = [[], [], []];
    var $chartEl = this.$('.' + type + 'Chart');

    this.collectChartData(this.model[type], labels, data, false);

    $chartEl.height(labels.length * PIXELS_PER_Y);
    $chartEl.on(
      'jqplotDataMouseOver', this.showTooltip.bind(null, time.toString, true)
    );

    $chartEl.jqplot(data, {
      stackSeries: true,
      seriesColors: SERIES_COLORS,
      seriesDefaults: {
        renderer: $.jqplot.BarRenderer,
        rendererOptions: {
          barDirection: 'horizontal',
          highlightMouseOver: false
        },
        pointLabels: {
          show: true,
          stackedValue: true,
          onlySeriesIndex: 2,
          formatString: '...',
          formatter: function(_, value)
          {
            return time.toString(value);
          }
        }
      },
      axes: {
        yaxis: {
          renderer: $.jqplot.CategoryAxisRenderer,
          ticks: labels
        },
        xaxis: {
          tickOptions: {
            formatter: function(_, value)
            {
              if (value < 60)
              {
                return value + 's';
              }

              if (value < 3600)
              {
                return Math.round(value / 60 * 10) / 10 + 'min';
              }

              return Math.round(value / 3600 * 10) / 10 + 'h';
            }
          }
        }
      }
    });

    this.plots[type] = $chartEl.data('jqplot');
  };

  /**
   * @private
   */
  StatsView.prototype.renderCountsChart = function(type)
  {
    var labels = [];
    var data = [[], [], []];
    var $chartEl = this.$('.' + type + 'Chart');

    this.collectChartData(this.model[type], labels, data, false);

    $chartEl.height(labels.length * PIXELS_PER_Y);
    $chartEl.on('jqplotDataMouseOver', this.showTooltip.bind(null, null, true));

    $chartEl.jqplot(data, {
      stackSeries: true,
      seriesColors: SERIES_COLORS,
      seriesDefaults: {
        renderer: $.jqplot.BarRenderer,
        rendererOptions: {
          barDirection: 'horizontal',
          highlightMouseOver: false
        },
        pointLabels: {
          show: true,
          stackedValue: true,
          onlySeriesIndex: 2
        }
      },
      axes: {
        yaxis: {
          renderer: $.jqplot.CategoryAxisRenderer,
          ticks: labels
        }
      }
    });

    this.plots[type] = $chartEl.data('jqplot');
  };

  var TIME_UNIT_TO_FORMAT = {
    'hour': 'HH:00',
    'day': 'YYYY-MM-DD',
    'month': 'YYYY-MM',
    'year': 'YYYY'
  };

  /**
   * @private
   */
  StatsView.prototype.renderDateChart = function(type)
  {
    var input = {};
    var format = TIME_UNIT_TO_FORMAT[this.model[type].$unit];

    for (var k in this.model[type])
    {
      if (!this.model[type].hasOwnProperty(k) || k[0] === '$')
      {
        continue;
      }

      input[moment(parseInt(k)).format(format)] = this.model[type][k];
    }

    var labels = [];
    var data = [[], [], []];
    var $chartEl = this.$('.' + type + 'Chart');

    this.collectChartData(input, labels, data, true);

    $chartEl.height(400);
    $chartEl.on(
      'jqplotDataMouseOver', this.showTooltip.bind(null, time.toString, false)
    );

    $chartEl.jqplot(data, {
      stackSeries: true,
      seriesColors: SERIES_COLORS,
      seriesDefaults: {
        renderer: $.jqplot.BarRenderer,
        rendererOptions: {
          highlightMouseOver: false
        },
        pointLabels: {
          show: true,
          stackedValue: true,
          onlySeriesIndex: 2,
          formatString: '...',
          formatter: function(_, value)
          {
            return time.toString(parseInt(value));
          }
        }
      },
      axes: {
        xaxis: {
          renderer: $.jqplot.CategoryAxisRenderer,
          ticks: labels
        },
        yaxis: {
          tickOptions: {
            formatter: function(_, value)
            {
              return time.toString(value);
            }
          }
        }
      }
    });

    this.plots[type] = $chartEl.data('jqplot');
  };

  /**
   * @private
   */
  StatsView.prototype.collectChartData = function(input, labels, data, noIndex)
  {
    var index = 1;

    for (var id in input)
    {
      if (!input.hasOwnProperty(id) || id[0] === '$')
      {
        continue;
      }

      var label = this.model.idToNameMap[id];

      if (typeof label === 'undefined')
      {
        label = id;
      }

      labels.push(label.length > 20 ? label.substr(0, 20) + '...' : label);

      for (var finishState in FINISH_STATES)
      {
        if (FINISH_STATES.hasOwnProperty(finishState))
        {
          data[FINISH_STATES[finishState]].push(
            noIndex ? input[id][finishState] : [input[id][finishState], index]
          );
        }
      }

      index++;
    }
  };

  /**
   * @private
   * @param {?Function} formatter
   * @param {Boolean} horizontal
   * @param {Object} e
   * @param {Number} seriesIndex
   * @param {Number} pointIndex
   * @param {Array} data
   */
  StatsView.prototype.showTooltip = function(formatter, horizontal, e, seriesIndex, pointIndex, data)
  {
    if (seriesIndex !== this.lastSeriesIndex
      || pointIndex !== this.lastPointIndex)
    {
      var value = horizontal ? data[0] : data[1];

      this.$tooltip.text(formatter ? formatter(value) : value);
      this.$tooltip.css('background-color', SERIES_COLORS[seriesIndex]);
      this.$tooltip.show();

      this.lastSeriesIndex = seriesIndex;
      this.lastPointIndex = pointIndex;
      this.leftOffset = -this.$tooltip.outerWidth(true) / 2;
    }

    this.$tooltip
      .css('top', e.pageY + this.topOffset)
      .css('left', e.pageX + this.leftOffset);
  };

  return StatsView;
});
