define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/user',
  'app/models/History',
  'app/views/viewport',
  'app/views/PageLayout',
  'app/views/history/HistoryEntriesTableView',
  'app/views/programs/ProgramDetailsView',
  'app/views/programs/DeleteProgramView',

  'text!app/templates/programs/detailsPage.html'
],
/**
 * @param {jQuery} $
 * @param {Underscore} _
 * @param {Backbone} Backbone
 * @param {Object} user
 * @param {Object} History
 * @param {Viewport} viewport
 * @param {function(new:PageLayout)} PageLayout
 * @param {function(new:HistoryEntriesTableView)} HistoryEntriesTableView
 * @param {function(new:ProgramDetailsView)} ProgramDetailsView
 * @param {function(new:DeleteProgramView)} DeleteProgramView
 * @param {String} detailsPageTpl
 */
function(
  $,
  _,
  Backbone,
  user,
  History,
  viewport,
  PageLayout,
  HistoryEntriesTableView,
  ProgramDetailsView,
  DeleteProgramView,
  detailsPageTpl)
{
  /**
   * @class ProgramDetailsPageView
   * @constructor
   * @extends Backbone.View
   * @param {Object} [options]
   */
  var ProgramDetailsPageView = Backbone.View.extend({
    helpHash: 'programs-view',
    className: 'programDetailsPage',
    template: _.template(detailsPageTpl),
    layout: PageLayout,
    breadcrumbs: function()
    {
      return [
        {href: '#programs', text: 'Programy'},
        this.model.get('name')
      ];
    },
    actions: function()
    {
      var model = this.model;
      var id = model.id;

      return [
        {
          href: '#programs/' + id + ';edit',
          text: 'Edytuj',
          privileges: 'managePrograms'
        },
        {
          href: '#programs/' + id + ';delete',
          text: 'Usuń',
          privileges: 'managePrograms',
          handler: function(e)
          {
            if (e.button !== 0)
            {
              return;
            }

            viewport.showDialog(new DeleteProgramView({model: model}));

            return false;
          }
        }
      ];
    }
  });

  ProgramDetailsPageView.prototype.initialize = function()
  {
    this.detailsView = null;
    this.historyView = null;
  };

  ProgramDetailsPageView.prototype.destroy = function()
  {
    _.destruct(this, 'detailsView', 'historyView');

    this.remove();
  };

  ProgramDetailsPageView.prototype.render = function()
  {
    _.destruct(this, 'detailsView', 'historyView');

    this.el.innerHTML = this.template();

    this.detailsView = new ProgramDetailsView({model: this.model});
    this.detailsView.render();

    this.$('.details').append(this.detailsView.el);

    if (user.isAllowedTo('viewHistory'))
    {
      var history = new History();
      var self = this;

      history.fetch({
        data: {
          page: 1,
          limit: 5,
          conditions: {programId: this.model.id},
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
          if (!history.length)
          {
            return;
          }

          self.historyView = new HistoryEntriesTableView({
            showProgramName: false,
            collection: history
          });
          self.historyView.render();

          self.$('.history').append(self.historyView.el);
        }
      });
    }

    return this;
  };

  return ProgramDetailsPageView;
});
