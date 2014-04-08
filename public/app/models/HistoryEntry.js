// Copyright (c) 2014, Łukasz Walukiewicz <lukasz@walukiewicz.eu>. Some Rights Reserved.
// Licensed under CC BY-NC-SA 4.0 <http://creativecommons.org/licenses/by-nc-sa/4.0/>.
// Part of the walkner-outdoor project <http://lukasz.walukiewicz.eu/p/walkner-outdoor>

define(
[
  'Underscore',
  'Backbone',
  'moment',

  'app/time',
  'app/models/Program'
],
/**
 * @param {Underscore} _
 * @param {Backbone} Backbone
 * @param {Function} moment
 * @param {Object} time
 * @param {function(new:Program)} Program
 */
function(_, Backbone, moment, time, Program)
{
  var STATE_TO_TEXT = {
    finish: 'Ukończony',
    stop: 'Zatrzymany',
    error: 'Błąd'
  };

  var FINISH_STATE_TO_ZONE_STATE = {
    finish: 'programFinished',
    stop: 'programStopped',
    error: 'programErrored'
  };

  /**
   * @class HistoryEntry
   * @extends Backbone.Model
   * @constructor
   * @param {Object} [attributes]
   * @param {Object} [options]
   */
  var HistoryEntry = Backbone.Model.extend({
    urlRoot: '/history'
  });

  /**
   * @return {Object}
   */
  HistoryEntry.prototype.toTemplateData = function()
  {
    var data = this.toJSON();

    if (data.startedAt)
    {
      data.startDate = moment(data.startedAt).format('LLL');
    }

    if (data.finishState)
    {
      data.finishStateText = STATE_TO_TEXT[data.finishState];
      data.zoneFinishState = FINISH_STATE_TO_ZONE_STATE[data.finishState];
    }

    if (data.finishedAt)
    {
      data.finishDate = moment(data.finishedAt).format('LLL');
    }

    if (data.startedAt && data.finishedAt)
    {
      data.totalTime = (moment(data.finishedAt).diff(data.startedAt) / 1000).toFixed(2);
      data.duration = time.toString(parseFloat(data.totalTime));
    }

    return data;
  };

  return HistoryEntry;
});
