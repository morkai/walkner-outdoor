define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/views/viewport',

  'text!app/templates/diag/controllerDiag.html'
],
/**
 * @param {jQuery} $
 * @param {Underscore} _
 * @param {Backbone} Backbone
 * @param {Viewport} viewport
 * @param {String} controllerDiagTpl
 */
function(
  $,
  _,
  Backbone,
  viewport,
  controllerDiagTpl)
{
  /**
   * @class ControllerDiagView
   * @constructor
   * @extends Backbone.View
   * @param {Object} [options]
   */
  var ControllerDiagView = Backbone.View.extend({
    template: _.template(controllerDiagTpl),
    className: 'box',
    events: {
      'click .start': 'startController',
      'click .stop': 'stopController'
    }
  });

  ControllerDiagView.prototype.initialize = function()
  {
    var model = this.model;

    if (model.online)
    {
      model.startedAt = moment(model.startTime).format('LLLL');
    }
    else
    {
      model.online = false;
      model.startTime = '0';
      model.startedAt = '-';
    }
  };

  ControllerDiagView.prototype.destroy = function()
  {
    this.remove();
  };

  ControllerDiagView.prototype.render = function()
  {
    this.el.innerHTML = this.template(this.model);

    var controllerEl = this.$('.controller');

    if (!this.model.online)
    {
      this.$('.property[data-property="startedAt"]').hide();
      this.$('.property[data-property="uptime"]').hide();
      this.$('.property[data-property="requestTime"]').hide();

      controllerEl.addClass('offline');
    }
    else
    {
      controllerEl.addClass('online');
    }

    return this;
  };

  /**
   * @private
   */
  ControllerDiagView.prototype.started = function()
  {
    var model = this.model;

    model.online = true;
    model.startTime = Date.now();
    model.startedAt = moment(this.model.startTime).format('LLLL');

    this.render();
  };

  /**
   * @private
   */
  ControllerDiagView.prototype.stopped = function()
  {
    var model = this.model;

    model.online = false;
    model.startTime = 0;
    model.startedAt = '-';

    this.render();
  };

  /**
   * @private
   * @param {Object} results
   */
  ControllerDiagView.prototype.timed = function(results)
  {
    var value = '';

    value += (results.last ? results.last : '1') + ' ';
    value += '(avg=' + (results.avg ? results.avg : '1');
    value += ' min=' + (results.min ? results.min : '1');
    value += ' max=' + (results.max ? results.max : '1') + ')';

    this.$('.property[data-property="requestTime"] .property-value').text(value);
  };

  /**
   * @private
   */
  ControllerDiagView.prototype.startController = function()
  {
    var startEl = this.$('.start');

    startEl.attr('disabled', true);

    $.ajax({
      url: '/controllers/' + this.model._id,
      type: 'POST',
      data: {action: 'start'},
      error: function(xhr)
      {
        viewport.msg.show({
          type: 'error',
          time: 2000,
          text: 'Nie udało się uruchomić sterownika: '
            + (xhr.responseText || xhr.statusText)
        });
      },
      complete: function()
      {
        startEl.attr('disabled', false);
      }
    });
  };

  /**
   * @private
   */
  ControllerDiagView.prototype.stopController = function()
  {
    var stopEl = this.$('.stop');

    stopEl.attr('disabled', true);

    $.ajax({
      url: '/controllers/' + this.model._id,
      type: 'POST',
      data: {action: 'stop'},
      error: function(xhr)
      {
        viewport.msg.show({
          type: 'error',
          time: 2000,
          text: 'Nie udało się zatrzymać sterownika: ' +
            (xhr.responseText || xhr.statusText)
        });
      },
      complete: function()
      {
        stopEl.attr('disabled', false);
      }
    });
  };

  return ControllerDiagView;
});
