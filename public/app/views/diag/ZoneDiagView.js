define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/views/viewport',

  'text!app/templates/diag/zoneDiag.html'
],
/**
 * @param {jQuery} $
 * @param {Underscore} _
 * @param {Backbone} Backbone
 * @param {Viewport} viewport
 * @param {String} zoneDiagTpl
 */
function(
  $,
  _,
  Backbone,
  viewport,
  zoneDiagTpl)
{
  /**
   * @class ZoneDiagView
   * @constructor
   * @extends Backbone.View
   * @param {Object} [options]
   */
  var ZoneDiagView = Backbone.View.extend({
    template: _.template(zoneDiagTpl),
    tagName: 'tr',
    className: 'zone',
    events: {
      'click .start': 'startZone',
      'click .stop': 'stopZone'
    }
  });

  ZoneDiagView.prototype.initialize = function()
  {
    var model = this.model;

    if (model._id)
    {
      model.id = model._id;
    }

    if (model.online)
    {
      model.startedAt = moment(model.startTime).format('LLL');
    }
    else
    {
      model.online = false;
      model.startTime = '0';
      model.startedAt = '-';
    }

    if (!_.isObject(model.program) || model.state !== 'programRunning')
    {
      model.program = null;
    }
  };

  ZoneDiagView.prototype.destroy = function()
  {
    this.remove();
  };

  ZoneDiagView.prototype.render = function()
  {
    this.el.innerHTML = this.template(this.model);

    var zoneEl = $(this.el);

    zoneEl.removeClass('offline online');

    if (!this.model.online)
    {
      this.$('[data-property="startedAt"]').text('-');
      this.$('[data-property="uptime"]').text('-');

      zoneEl.addClass('offline');
    }
    else
    {
      zoneEl.addClass('online');
    }

    this.renderProgram();

    return this;
  };

  /**
   * @private
   */
  ZoneDiagView.prototype.renderProgram = function()
  {
    var program = this.model.program;
    var propertyEl = this.$('[data-property="program"]');

    if (_.isObject(program))
    {
      propertyEl.html('<a href="#programs/' + program._id + '">' + program.name + '</a>');
    }
    else
    {
      propertyEl.text('-');
    }
  };

  /**
   * @private
   */
  ZoneDiagView.prototype.started = function()
  {
    var model = this.model;

    model.online = true;
    model.startTime = Date.now();
    model.startedAt = moment(model.startTime).format('LLL');
    model.program = null;

    this.render();
  };

  /**
   * @private
   */
  ZoneDiagView.prototype.stopped = function()
  {
    var model = this.model;

    model.online = false;
    model.startTime = 0;
    model.startedAt = '-';
    model.program = null;

    this.render();
  };

  /**
   * @private
   * @param {Object} program
   */
  ZoneDiagView.prototype.programStarted = function(program)
  {
    this.model.program = program;

    this.renderProgram();
  };

  /**
   * @private
   */
  ZoneDiagView.prototype.programStopped = function()
  {
    this.model.program = {_id: 0, name: '-'};

    this.renderProgram();
  };

  /**
   * @private
   */
  ZoneDiagView.prototype.startZone = function()
  {
    var startEl = this.$('.start');

    startEl.attr('disabled', true);

    $.ajax({
      url: '/zones/' + this.model._id,
      type: 'POST',
      data: {action: 'start'},
      error: function(xhr)
      {
        viewport.msg.show({
          type: 'error',
          time: 2000,
          text: 'Nie udało się uruchomić strefy: ' +
            (xhr.responseText || xhr.statusText)
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
  ZoneDiagView.prototype.stopZone = function()
  {
    var stopEl = this.$('.stop');

    stopEl.attr('disabled', true);

    $.ajax({
      url: '/zones/' + this.model._id,
      type: 'POST',
      data: {action: 'stop'},
      error: function(xhr)
      {
        viewport.msg.show({
          type: 'error',
          time: 2000,
          text: 'Nie udało się zatrzymać strefy: ' +
            (xhr.responseText || xhr.statusText)
        });
      },
      complete: function()
      {
        stopEl.attr('disabled', false);
      }
    });
  };

  return ZoneDiagView;
});
