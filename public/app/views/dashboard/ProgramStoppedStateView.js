define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/models/Program',

  'text!app/templates/dashboard/programStoppedState.html'
],
/**
 * @param {jQuery} $
 * @param {Underscore} _
 * @param {Backbone} Backbone
 * @param {function(new:Program)} Program
 * @param {String} programStoppedStateTpl
 */
function($, _, Backbone, Program, programStoppedStateTpl)
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
    template: _.template(programStoppedStateTpl)
  });

  ProgramStoppedStateView.prototype.initialize = function()
  {

  };

  ProgramStoppedStateView.prototype.destroy = function()
  {
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

    return this;
  };

  return ProgramStoppedStateView;
});
