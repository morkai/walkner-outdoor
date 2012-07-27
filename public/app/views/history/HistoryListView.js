define(
[
  'jQuery',
  'Underscore',
  'Backbone',
  'moment',

  'app/views/viewport',
  'app/views/PageLayout',
  'app/views/PaginatorView',
  'app/views/history/HistoryEntriesTableView',
  'app/views/history/PurgeHistoryFormView',

  'text!app/templates/history/list.html'
],
/**
 * @param {jQuery} $
 * @param {Underscore} _
 * @param {Backbone} Backbone
 * @param {moment} moment
 * @param {Viewport} viewport
 * @param {function(new:PageLayout)} PageLayout
 * @param {function(new:PaginatorView)} PaginatorView
 * @param {function(new:HistoryEntriesTableView)} HistoryEntriesTableView
 * @param {function(new:PurgeHistoryFormView)} PurgeHistoryFormView
 * @param {String} listTpl
 */
function(
  $,
  _,
  Backbone,
  moment,
  viewport,
  PageLayout,
  PaginatorView,
  HistoryEntriesTableView,
  PurgeHistoryFormView,
  listTpl)
{
  var FILTER_DATA_STORAGE_KEY = 'historyListViewFilterData';

  /**
   * @class HistoryListView
   * @constructor
   * @extends Backbone.View
   * @param {Object} [options]
   */
  var HistoryListView = Backbone.View.extend({
    helpHash: 'history-browse',
    template: _.template(listTpl),
    layout: PageLayout,
    title: 'Historia',
    className: 'history',
    breadcrumbs: ['Historia'],
    actions: function()
    {
      var onPurge = this.onPurge;

      return [
        {
          href: '#history;stats',
          text: 'Pokaż statystyki',
          className: 'blue action',
          privileges: 'stats'
        },
        {
          href: '#history;purge',
          text: 'Wyczyść',
          className: 'blue purge-history action',
          privileges: 'purgeHistory',
          handler: function(e)
          {
            if (e.button !== 0)
            {
              return;
            }

            viewport.showDialog(new PurgeHistoryFormView({onPurge: onPurge}));

            return false;
          }
        }
      ];
    },
    events: {
      'change .historyFilter': 'filter',
      'click #clearHistoryFilter': 'clearFilter',
      'click .pages a': 'changePage'
    }
  });

  HistoryListView.prototype.initialize = function(options)
  {
    _.bindAll(this, 'onPurge');

    this.tableView = null;
    this.paginatorView = null;

    var filterData = sessionStorage.getItem(FILTER_DATA_STORAGE_KEY);

    this.filterData = filterData ? JSON.parse(filterData) : {};
  };

  HistoryListView.prototype.destroy = function()
  {
    _.destruct(this, 'tableView', 'paginatorView');

    this.remove();
  };

  HistoryListView.prototype.render = function()
  {
    _.destruct(this, 'tableView', 'paginatorView');

    this.tableView = new HistoryEntriesTableView({
      collection: this.collection
    });

    this.paginatorView = new PaginatorView({
      model: new Backbone.Model({
        pageNumbers: 7,
        currentPage: 1,
        pageCount: 0,
        href: '#history?page=${page}'
      })
    });

    var filterData = _.defaults(this.filterData, {
      zone: '',
      program: '',
      state: ['finish', 'stop', 'error']
    });

    filterData.from = filterData.from
      ? moment(filterData.from).format('YYYY-MM-DD HH:mm:ss') : '';
    filterData.to = filterData.to
      ? moment(filterData.to).format('YYYY-MM-DD HH:mm:ss') : '';

    this.el.innerHTML = this.template({
      programs: this.model.programs || [],
      zones: this.model.zones || [],
      filterData: filterData
    });

    this.$('.historyEntriesContainer')
      .append(this.tableView.el)
      .append(this.paginatorView.el);

    var self = this;

    _.defer(function()
    {
      self.$('#historyFilterProgram').chosen({
        no_results_text: "Brak wyników dla"
      });

      self.$('#historyFilterZone').chosen({
        no_results_text: "Brak wyników dla"
      });
    });

    this.refresh();

    return this;
  };

  /**
   * @private
   */
  HistoryListView.prototype.refresh = function()
  {
    var conditions = {};

    if (this.filterData.program)
    {
      conditions.programId = this.filterData.program;
    }

    if (this.filterData.zone)
    {
      conditions.zoneId = this.filterData.zone;
    }

    if (this.filterData.state)
    {
      conditions.finishState = {$in: this.filterData.state};
    }

    if (this.filterData.from)
    {
      conditions.startedAt = {$gte: this.filterData.from};
    }

    if (this.filterData.to)
    {
      conditions.finishedAt = {$lte: this.filterData.to};
    }

    var self = this;

    this.collection.fetch({
      data: {
        page: this.collection.page,
        limit: 10,
        conditions: conditions,
        fields: {
          zoneName: 1,
          programName: 1,
          startedAt: 1,
          finishedAt: 1,
          finishState: 1
        }
      },
      success: function()
      {
        if (self.paginatorView)
        {
          self.paginatorView.model.set({
            currentPage: self.collection.page,
            pageCount: self.collection.pages
          });
        }
      }
    })
  };

  /**
   * @private
   */
  HistoryListView.prototype.filter = function()
  {
    var filterData = this.filterData = this.$('.historyFilter').toObject();

    function prepareTime(type)
    {
      if (filterData[type])
      {
        var time = moment(filterData[type], 'YYYY-MM-DD HH:mm:ss').valueOf();

        if (isNaN(time) || time < 0)
        {
          delete filterData[type];
        }
        else
        {
          filterData[type] = new Date(time).toJSON();
        }
      }
    }

    prepareTime('from');
    prepareTime('to');

    sessionStorage.setItem(
      FILTER_DATA_STORAGE_KEY, JSON.stringify(this.filterData)
    );

    this.collection.page = 1;

    this.refresh();
  };

  /**
   * @private
   */
  HistoryListView.prototype.changePage = function(e)
  {
    var page = $(e.target).attr('data-page');

    this.collection.page = parseInt(page);

    this.refresh();

    Backbone.history.navigate('history?page=' + page);

    e.preventDefault();
  };

  /**
   * @private
   */
  HistoryListView.prototype.clearFilter = function(e)
  {
    var programFilterEl = this.$('#historyFilterProgram');
    var zoneFilterEl = this.$('#historyFilterZone');

    programFilterEl.find('option[value=""]').attr('selected', true);
    zoneFilterEl.find('option[value=""]').attr('selected', true);

    programFilterEl.trigger('liszt:updated');
    zoneFilterEl.trigger('liszt:updated');

    this.$('#historyFilterState input').attr('checked', true);

    this.$('#historyFilterFrom, #historyFilterTo').val('');

    this.filter();

    Backbone.history.navigate('history?page=1');
  };

  /**
   * @private
   */
  HistoryListView.prototype.onPurge = function()
  {
    this.filter();
  };

  return HistoryListView;
});
