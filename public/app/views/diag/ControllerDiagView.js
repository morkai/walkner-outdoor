define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/views/viewport',

  'text!app/templates/diag/controllerDiag.html'
],
function(
  $,
  _,
  Backbone,
  viewport,
  controllerDiagTpl)
{
  var renderControllerDiag = _.template(controllerDiagTpl);

  return Backbone.View.extend({

    className: 'box',

    events: {
      'click .start': 'startController',
      'click .stop' : 'stopController'
    },

    initialize: function()
    {
      var model = this.model;

      if (model._id)
      {
        model.id = model._id;
      }

      if (model.online)
      {
        var startedAt = moment(model.startedAt);

        model.startTime = startedAt.valueOf();
        model.startedAt = startedAt.format('LLLL');
      }
      else
      {
        model.online    = false;
        model.startTime = '0';
        model.startedAt = '-';
      }
    },

    destroy: function()
    {
      $(this.el).remove();
      this.el = null;
    },

    render: function()
    {
      this.el.innerHTML = renderControllerDiag(this.model);

      var controllerEl = this.$('.controller');

      if (!this.model.online)
      {
        this.$('.property[data-property="startedAt"]').hide();
        this.$('.property[data-property="uptime"]').hide();
        this.$('.property[data-property="ping"]').hide();
        this.$('.property[data-property="requestTime"]').hide();

        controllerEl.addClass('offline');
      }
      else
      {
        controllerEl.addClass('online');
      }

      return this;
    },

    started: function()
    {
      var model = this.model;

      model.online    = true;
      model.startTime = Date.now();
      model.startedAt = moment(this.model.startTime).format('LLLL');

      this.render();
    },

    stopped: function()
    {
      var model = this.model;

      model.online    = false;
      model.startTime = 0;
      model.startedAt = '-';

      this.render();
    },

    pinged: function(results)
    {
      var value = '';

      value += (results.last ? results.last : '?') + ' ';
      value += '(avg=' + (results.avg ? results.avg : '?');
      value += ' min=' + (results.min ? results.min : '?');
      value += ' max=' + (results.max ? results.max : '?');
      value += ' loss=' + results.loss + '%)';

      this.$('.property[data-property="ping"] .property-value').text(value);
    },

    timed: function(results)
    {
      var value = '';

      value += (results.last ? results.last : '1') + ' ';
      value += '(avg=' + (results.avg ? results.avg : '1');
      value += ' min=' + (results.min ? results.min : '1');
      value += ' max=' + (results.max ? results.max : '1') + ')';

      this.$('.property[data-property="requestTime"] .property-value').text(value);
    },

    startController: function(e)
    {
      var startEl = this.$('.start');

      startEl.attr('disabled', true);

      $.ajax({
        url: '/controllers/' + this.model.id,
        type: 'POST',
        data: {action: 'start'},
        error: function(xhr)
        {
          viewport.msg.show({
            type: 'error',
            time: 2000,
            text: 'Nie udało się uruchomić sterownika: ' +
                  (xhr.responseText || xhr.statusText)
          });
        },
        complete: function()
        {
          startEl.attr('disabled', false);
        }
      });
    },

    stopController: function(e)
    {
      var stopEl = this.$('.stop');

      stopEl.attr('disabled', true);

      $.ajax({
        url: '/controllers/' + this.model.id,
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
    }

  });
});