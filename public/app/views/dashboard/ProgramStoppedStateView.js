define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/models/Program',
  'app/views/dashboard/ZoneNeedsResetMixin',

  'text!app/templates/dashboard/programStoppedState.html'
],
/**
 * @param {jQuery} $
 * @param {Underscore} _
 * @param {Backbone} Backbone
 * @param {function(new:Program)} Program
 * @param {Object} ZoneNeedsResetMixin
 * @param {String} programStoppedStateTpl
 */
function($, _, Backbone, Program, ZoneNeedsResetMixin, programStoppedStateTpl)
{
  /**
   * @class ProgramStoppedStateView
   * @constructor
   * @extends Backbone.View
   * @param {Object} [options]
   */
  var ProgramStoppedStateView = Backbone.View.extend({
    tagName: 'div',
    className: 'programStopped',
    template: _.template(programStoppedStateTpl),
    events: {
      'click .resetZone': 'resetZone'
    }
  });

  _.extend(ProgramStoppedStateView.prototype, ZoneNeedsResetMixin);

  ProgramStoppedStateView.prototype.initialize = function()
  {
    this.model.bind('change:needsReset', this.toggleResetAction, this);
  };

  ProgramStoppedStateView.prototype.destroy = function()
  {
    this.model.unbind('change:needsReset', this.toggleResetAction, this);

    this.remove();
  };

  /**
   * @return {ProgramStoppedStateView}
   */
  ProgramStoppedStateView.prototype.render = function()
  {
    var data = this.model.toJSON();

    data.program.duration = Program.calcDuration(
      data.program.startTime, data.program.stopTime
    );

    this.el.innerHTML = this.template(data);

    this.toggleResetAction();

    return this;
  };

  return ProgramStoppedStateView;
});
