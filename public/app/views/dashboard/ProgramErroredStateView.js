define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/models/Program',

  'text!app/templates/dashboard/programErroredState.html'
],
/**
 * @param {jQuery} $
 * @param {Underscore} _
 * @param {Backbone} Backbone
 * @param {function(new:Program)} Program
 * @param {String} programErroredStateTpl
 */
function($, _, Backbone, Program, programErroredStateTpl)
{
  /**
   * @class ProgramErroredStateView
   * @constructor
   * @extends Backbone.View
   * @param {Object} [options]
   */
  var ProgramErroredStateView = Backbone.View.extend({
    tagName: 'div',
    className: 'programErrored',
    template: _.template(programErroredStateTpl)
  });

  ProgramErroredStateView.prototype.destroy = function()
  {
    this.remove();
  };

  /**
   * @return {ProgramErroredStateView}
   */
  ProgramErroredStateView.prototype.render = function()
  {
    var data = this.model.toJSON();

    data.program.duration = Program.calcDuration(
      data.program.startTime, data.program.stopTime
    );

    this.el.innerHTML = this.template(data);

    return this;
  };

  return ProgramErroredStateView;
});
