define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/models/Program',

  'text!app/templates/dashboard/programFinishedState.html'
],
/**
 * @param {jQuery} $
 * @param {Underscore} _
 * @param {Backbone} Backbone
 * @param {function(new:Program)} Program
 * @param {String} programFinishedStateTpl
 */
function($, _, Backbone, Program, programFinishedStateTpl)
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
    template: _.template(programFinishedStateTpl)
  });

  ProgramFinishedStateView.prototype.destroy = function()
  {
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

    return this;
  };

  return ProgramFinishedStateView;
});
