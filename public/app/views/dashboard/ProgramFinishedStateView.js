define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/models/Program',
  'app/views/dashboard/ZoneNeedsResetMixin',

  'text!app/templates/dashboard/programFinishedState.html'
],
/**
 * @param {jQuery} $
 * @param {Underscore} _
 * @param {Backbone} Backbone
 * @param {function(new:Program)} Program
 * @param {Object} ZoneNeedsResetMixin
 * @param {String} programFinishedStateTpl
 */
function($, _, Backbone, Program, ZoneNeedsResetMixin, programFinishedStateTpl)
{
  /**
   * @class ProgramFinishedStateView
   * @constructor
   * @extends Backbone.View
   * @param {Object} [options]
   */
  var ProgramFinishedStateView = Backbone.View.extend({
    tagName: 'div',
    className: 'programFinished',
    template: _.template(programFinishedStateTpl),
    events: {
      'click .resetZone': 'resetZone'
    }
  });

  _.extend(ProgramFinishedStateView.prototype, ZoneNeedsResetMixin);

  ProgramFinishedStateView.prototype.initialize = function()
  {
    this.model.bind('change:needsReset', this.toggleResetAction, this);
  };

  ProgramFinishedStateView.prototype.destroy = function()
  {
    this.model.unbind('change:needsReset', this.toggleResetAction, this);

    this.remove();
  };

  /**
   * @return {ProgramFinishedStateView}
   */
  ProgramFinishedStateView.prototype.render = function()
  {
    var data = this.model.toJSON();

    data.program.duration = Program.calcDuration(
      data.program.startTime, data.program.stopTime
    );

    this.el.innerHTML = this.template(data);

    this.toggleResetAction();

    return this;
  };

  return ProgramFinishedStateView;
});
