define(
[
  'Underscore',
  'Backbone',
  'moment'
],
/**
 * @param {Underscore} _
 * @param {Backbone} Backbone
 * @param {Function} moment
 */
function(_, Backbone, moment)
{
  const STATE_TO_TEXT = {
    finish: 'Ukończony',
    stop  : 'Zatrzymany',
    error : 'Błąd'
  };

  /**
   * @class History
   * @extends Backbone.Model
   * @constructor
   * @param {Object} [attributes]
   * @param {Object} [options]
   */
  var History = Backbone.Model.extend({
    urlRoot: '/history'
  });

  /**
   * @return {Object}
   */
  History.prototype.toTemplateData = function()
  {
    var data = this.toJSON();

    if (data.startedAt)
    {
      data.startDate = moment(data.startedAt).format('LLL');
    }

    if (data.finishState)
    {
      data.finishStateText = STATE_TO_TEXT[data.finishState];
    }

    if (data.finishedAt)
    {
      data.finishDate = moment(data.finishedAt).format('LLL');
    }

    if (data.startedAt && data.finishedAt)
    {
      data.totalTime = (moment(data.finishedAt).diff(data.startedAt) / 1000).toFixed(2);
    }

    return data;
  };

  return History;
});
