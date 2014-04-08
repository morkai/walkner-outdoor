// Copyright (c) 2014, Łukasz Walukiewicz <lukasz@walukiewicz.eu>. Some Rights Reserved.
// Licensed under CC BY-NC-SA 4.0 <http://creativecommons.org/licenses/by-nc-sa/4.0/>.
// Part of the walkner-outdoor project <http://lukasz.walukiewicz.eu/p/walkner-outdoor>

define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/views/viewport',

  'text!app/templates/diag/programDiag.html'
],
/**
 * @param {jQuery} $
 * @param {Underscore} _
 * @param {Backbone} Backbone
 * @param {Viewport} viewport
 * @param {String} programDiagTpl
 */
function(
  $,
  _,
  Backbone,
  viewport,
  programDiagTpl)
{
  /**
   * @class ProgramDiagView
   * @constructor
   * @extends Backbone.View
   * @param {Object} [options]
   */
  var ProgramDiagView = Backbone.View.extend({
    template: _.template(programDiagTpl),
    tagName: 'tr',
    className: 'program online',
    events: {
      'click .stop': 'stopProgram'
    }
  });

  ProgramDiagView.prototype.initialize = function()
  {
    var model = this.model;

    var startedAt = moment(model.startedAt);

    model.startTime = startedAt.valueOf();
    model.startedAt = startedAt.format('LLL');
  };

  ProgramDiagView.prototype.destroy = function()
  {
    this.remove();
  };

  ProgramDiagView.prototype.render = function()
  {
    this.el.innerHTML = this.template(this.model);

    return this;
  };

  /**
   * @private
   */
  ProgramDiagView.prototype.stopProgram = function()
  {
    var stopEl = this.$('.stop');

    stopEl.attr('disabled', true);

    $.ajax({
      url: '/zones/' + this.model.zoneId,
      type: 'POST',
      data: {action: 'stopProgram'},
      error: function(xhr)
      {
        viewport.msg.show({
          type: 'error',
          time: 2000,
          text: 'Nie udało się zatrzymać programu: ' +
            (xhr.responseText || xhr.statusText)
        });
      },
      complete: function()
      {
        stopEl.attr('disabled', false);
      }
    });
  };

  return ProgramDiagView;
});
