define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/views/viewport',

  'text!app/templates/diag/zoneDiag.html'
],
function(
  $,
  _,
  Backbone,
  viewport,
  zoneDiagTpl)
{
  var renderZoneDiag = _.template(zoneDiagTpl);

  return Backbone.View.extend({

    className: 'box',

    events: {
      'click .start': 'startZone',
      'click .stop' : 'stopZone'
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

      if (!model.program)
      {
        model.program = {id: 0, name: '-'};
      }
    },

    destroy: function()
    {
      $(this.el).remove();
      this.el = null;
    },

    render: function()
    {
      this.el.innerHTML = renderZoneDiag(this.model);

      var zoneEl = this.$('.zone');

      if (!this.model.online)
      {
        this.$('.property[data-property="startedAt"]').hide();
        this.$('.property[data-property="uptime"]').hide();

        zoneEl.addClass('offline');
      }
      else
      {
        zoneEl.addClass('online');
      }

      this.renderProgram();

      return this;
    },

    renderProgram: function()
    {
      var program    = this.model.program;
      var propertyEl = this.$('.property[data-property="program"]');

      if (program.id)
      {
        var valueEl = propertyEl.find('.property-value');

        valueEl.attr('href', '#programs/' + program.id);
        valueEl.text(program.name);

        propertyEl.show();
      }
      else
      {
        propertyEl.hide();
      }
    },

    started: function()
    {
      var model = this.model;

      model.online    = true;
      model.startTime = Date.now();
      model.startedAt = moment(this.model.startTime).format('LLLL');
      model.program   = {id: 0, name: '-'};

      this.render();
    },

    stopped: function()
    {
      var model = this.model;

      model.online    = false;
      model.startTime = 0;
      model.startedAt = '-';
      model.program   = {id: 0, name: '-'};

      this.render();
    },

    programStarted: function(program)
    {
      this.model.program = program;

      this.renderProgram();
    },

    programStopped: function()
    {
      this.model.program = {id: 0, name: '-'};

      this.renderProgram();
    },

    startZone: function(e)
    {
      var startEl = this.$('.start');

      startEl.attr('disabled', true);

      $.ajax({
        url: '/zones/' + this.model.id,
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
    },

    stopZone: function(e)
    {
      var stopEl = this.$('.stop');

      stopEl.attr('disabled', true);

      $.ajax({
        url: '/zones/' + this.model.id,
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
    }

  });
});
