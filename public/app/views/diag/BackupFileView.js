define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/time',
  'app/views/viewport',

  'text!app/templates/diag/backupFile.html'
],
/**
 * @param {jQuery} $
 * @param {Underscore} _
 * @param {Backbone} Backbone
 * @param {Object} time
 * @param {Viewport} viewport
 * @param {String} backupFileTpl
 */
function(
  $,
  _,
  Backbone,
  time,
  viewport,
  backupFileTpl)
{
  /**
   * @class BackupFileView
   * @constructor
   * @extends Backbone.View
   * @param {Object} [options]
   */
  var BackupFileView = Backbone.View.extend({
    template: _.template(backupFileTpl),
    tagName: 'tr',
    className: 'backupFile',
    events: {
      'click .remove': 'removeBackupFile'
    }
  });

  BackupFileView.prototype.initialize = function()
  {
    var model = this.model;

    var days = Math.floor((Date.now() - time.offset - model.time) / 86400000);

    model.daysOld = days < 1 ? '<1' : days.toString();

    model.time = moment(model.time - time.offset).format('LLLL');

    var kb = 1024;
    var mb = kb * kb;

    if (model.size >= mb)
    {
      model.size = (Math.round(model.size / mb * 100) / 100) + ' MB';
    }
    else if (model.size >= kb)
    {
      model.size = (Math.round(model.size / kb * 100) / 100) + ' kB';
    }
    else
    {
      model.size = model.size + ' B';
    }

  };

  BackupFileView.prototype.destroy = function()
  {
    this.remove();
  };

  BackupFileView.prototype.render = function()
  {
    this.el.innerHTML = this.template(this.model);

    return this;
  };

  /**
   * @private
   */
  BackupFileView.prototype.removeBackupFile = function(e)
  {
    var $action = $(e.target);

    $action.attr('disabled', true);

    $.ajax({
      type: 'DELETE',
      url: '/diag/backups/' + $action.attr('data-id'),
      success: function()
      {
        viewport.msg.show({
          type: 'success',
          time: 2000,
          text: 'Kopie zapasowa bazy danych została usunięta :)'
        });
      },
      error: function()
      {
        viewport.msg.show({
          type: 'error',
          time: 3000,
          text: 'Nie udało się usunąć kopii zapasowej bazy danych :('
        });
      },
      complete: function()
      {
        $action.removeAttr('disabled');
      }
    });
  };

  return BackupFileView;
});
