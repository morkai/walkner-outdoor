define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/models/limits',

  'app/views/viewport',
  'app/views/PageLayout',
  'app/views/ListView'
],
/**
 * @param {jQuery} $
 * @param {Underscore} _
 * @param {Backbone} Backbone
 * @param {Object} limits
 * @param {Viewport} viewport
 * @param {function(new:PageLayout)} PageLayout
 * @param {function(new:ListView)} ListView
 */
function($, _, Backbone, limits, viewport, PageLayout, ListView)
{
  /**
   * @class ProgramListView
   * @constructor
   * @extends ListView
   * @param {Object} [options]
   */
  var ProgramListView = ListView.extend({
    layout: PageLayout,
    title: 'Programy',
    className: 'programs',
    breadcrumbs: ['Programy'],
    actions: [
      {
        href: '#programs;add',
        text: 'Dodaj',
        className: 'blue add-program action',
        privileges: 'managePrograms'
      }
    ]
  });

  ProgramListView.prototype.render = function()
  {
    ListView.prototype.render.call(this);

    if (this.collection.length >= limits.maxPrograms)
    {
      this.disableAddAction();
    }

    return this;
  };

  /**
   * @private
   */
  ProgramListView.prototype.disableAddAction = function()
  {
    var addAction = $('.add-program.action').first();

    addAction.addClass('disabled');
    addAction.click(function()
    {
      viewport.msg.show({
        type: 'error',
        text: 'Nie można dodać programu. Maksymalna ilość programów została osiągnięta.',
        time: 4000
      });

      return false;
    });
  };

  return ProgramListView;
});
