define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/time',
  'app/user',
  'app/models/Program',
  'app/views/viewport',
  'app/views/ProgramPickerView',
  'app/views/EnterPinFormView',

  'text!app/templates/zones/zone.html'
],
function(
  $,
  _,
  Backbone,
  time,
  user,
  Program,
  viewport,
  ProgramPickerView,
  EnterPinFormView,
  zoneTpl)
{
  var renderZone = _.template(zoneTpl);

  return Backbone.View.extend({

    events: {
      'click .zone-action-start': 'start',
      'click .zone-action-stop': 'stop'
    },

    initialize: function()
    {
      _.bindAll(
        this,
        'showProgramPicker',
        'updateProgress',
        'updateState'
      );

      this.progressUpdates = 0;
      this.redLedTimeout   = null;

      this.model.bind('change:state', this.updateState);
    },

    destroy: function()
    {
      clearTimeout(this.redLedTimeout);

      this.model.unbind('change:state', this.updateState);
      this.remove();
    },

    render: function()
    {
      this.el.innerHTML = renderZone(this.prepareViewData());

      if (!user.isAllowedTo('startStop'))
      {
        this.$('.action').hide();
      }

      this.updateState();

      return this;
    },

    updateState: function()
    {
      clearTimeout(this.redLedTimeout);

      var model = this.model;
      var state = model.get('state');

      var zoneEl = this.$('.zone').removeClass('zone-active');
      var ledEl  = zoneEl.find('.zone-led')
                         .removeClass('gray green red')
                         .attr('title', '');

      if (!_.isObject(state))
      {
        ledEl.addClass('gray');

        return;
      }

      if (state.finishState)
      {
        if (state.finishState === 'error')
        {
          ledEl.addClass('red').attr('title', state.errorMessage);

          var offset = state.finishedAt
            ? Date.now() - new Date(state.finishedAt).getTime()
            : 0;

          this.redLedTimeout = _.timeout(30000 - offset, function()
          {
            model.set({state: null});
          });
        }
        else
        {
          setTimeout(function() { model.set({state: null}); }, 1);
        }

        return;
      }

      this.progressUpdates = 0;
      this.updateProgress();

      ledEl.addClass('green');
      zoneEl.find('.zone-program').text(state.programName);
      zoneEl.addClass('zone-active');
    },

    updateProgress: function()
    {
      var state = this.model.get('state');

      if (!state)
      {
        return;
      }

      if (typeof state.totalTime === 'undefined')
      {
        state.totalTime = Program.countTotalTime(state.programSteps);
      }

      if (typeof state.startTime === 'undefined')
      {
        state.startTime = new Date(state.startedAt).getTime() - time.offset;
      }

      var startTime  = state.startTime;
      var totalTime  = state.totalTime * 1000;
      var endTime    = startTime + totalTime;
      var now        = Date.now();
      var completion = (Math.round(now / 1000) - Math.round(startTime / 1000))
                       / state.totalTime * 100;

      if (completion > 100)
      {
        completion = state.infinite ? completion % 100 : 100;
      }

      if (this.progressUpdates > 1 && completion === 0)
      {
        completion = 100;
      }

      var timeToEnd;

      if (state.infinite)
      {
        timeToEnd = '\u221E';
      }
      else
      {
        timeToEnd = this.translateEndTime(Math.round((endTime - now) / 1000));
      }

      this.$('.zone-end-time').text(timeToEnd);

      var valueEl = this.$('.zone-bar-value');

      if (completion < 1)
      {
        valueEl.hide();
      }
      else
      {
        valueEl.width(completion.toFixed(2) + '%').show();
      }

      this.progressUpdates += 1;
    },

    prepareViewData: function()
    {
      var zone  = this.model;
      var state = zone.get('state') || {};

      return {
        zoneId:      zone.get('_id'),
        zoneName:    zone.get('name'),
        programName: state.name,
        endTime:     'Obliczanie...'
      };
    },

    start: function()
    {
      var self = this;

      self.toggleActions();
      viewport.msg.loading();

      $.ajax({
        type   : 'GET',
        url    : '/zones/' + this.model.get('_id') + '/programs',
        success: this.showProgramPicker,
        error  : function()
        {
          self.toggleActions();
          viewport.msg.loadingFailed();
        }
      });
    },

    stop: function()
    {
      this.toggleActions();

      if (user.isLoggedIn())
      {
        return this.stopZone();
      }

      this.enterPinFormView = new EnterPinFormView({
        model: {
          zone  : {id: this.model.get('_id'), name: this.model.get('name')},
          action: 'stop'
        }
      });
      this.enterPinFormView.onPinEnter = _.bind(this.stopZone, this);
      this.enterPinFormView.render();

      viewport.showDialog(this.enterPinFormView);

      var programName = this.model.get('state').programName;
      var zoneName    = this.model.get('name');

      $(this.enterPinFormView.el).prepend(
        '<p class="content">Jeżeli chcesz zatrzymać program<br><strong>&lt;' +
        programName + '&gt;</strong><br>na strefie<br><strong>&lt;' +
        zoneName + '&gt;</strong><br>to podaj swój PIN i wciśnij przycisk' +
        ' <em>Stop</em>.</p>'
      );

      var self = this;

      viewport.bind('dialog:close', function closeDialog()
      {
        self.toggleActions();
        viewport.unbind('dialog:close', closeDialog);
      });
    },

    stopZone: function(pin)
    {
      $.ajax({
        url: '/zones/' + this.model.get('_id'),
        type: 'POST',
        data: {action: 'stopProgram', pin: pin},
        success: function()
        {
          viewport.msg.show({
            type: 'success',
            time: 3000,
            text: 'Strefa zatrzymana pomyślnie!'
          });
        },
        error: function(xhr)
        {
          viewport.msg.show({
            type: 'error',
            time: 3000,
            text: xhr.responseText || 'Nie udało się zatrzymać strefy :('
          });
        },
        complete: function()
        {
          viewport.closeDialog();
        }
      });
    },

    showProgramPicker: function(data)
    {
      var self              = this;
      var programPickerView = new ProgramPickerView({model: data});

      programPickerView.onProgramSelect = function(programId, pin)
      {
        self.toggleActions();
        viewport.closeDialog();
        self.startProgram(programId, pin);
      };

      viewport.showDialog(programPickerView);

      viewport.bind('dialog:close', function closeDialog()
      {
        self.toggleActions();
        viewport.unbind('dialog:close', closeDialog);
      });
    },

    startProgram: function(programId, pin)
    {
      var self = this;

      viewport.msg.show({
        delay: 200,
        text : 'Uruchamianie strefy...'
      });

      $.ajax({
        url:  '/zones/' + this.model.get('_id'),
        type: 'POST',
        data: {
          action:  'startProgram',
          program: programId,
          pin    : pin
        },
        success: function()
        {
          viewport.msg.show({
            type: 'success',
            time: 3000,
            text: 'Strefa uruchomiona pomyślnie!'
          });
        },
        error: function(xhr)
        {
          var text = xhr.responseText.length
            ? xhr.responseText
            : 'Nie udało się uruchomić strefy :(';

          viewport.msg.show({
            type: 'error',
            time: 3000,
            text: text
          });
        },
        complete: function()
        {
          self.toggleActions();
        }
      });
    },

    toggleActions: function()
    {
      var actions = this.$('.action');

      actions.attr('disabled', actions.attr('disabled') ? false : true);
    },

    translateEndTime: function(timeToEnd)
    {
      if (timeToEnd < 3)
      {
        return 'chwila...';
      }

      if (timeToEnd > 3600)
      {
        return 'ponad godzina...';
      }

      if (timeToEnd > 60)
      {
        if (timeToEnd < 120)
        {
          return 'ponad minuta...';
        }

        timeToEnd = Math.round(timeToEnd / 60);

        return '~' + timeToEnd + ' ' +
               (this.plural(timeToEnd) ? 'minuty' : 'minut');
      }

      return timeToEnd + ' ' + (this.plural(timeToEnd) ? 'sekundy' : 'sekund');
    },

    plural: function(n)
    {
      return (n % 10 < 5) && (n % 10 > 1) && (~~(n / 10) !== 1);
    },

    countTotalTime: function(steps)
    {
      var totalTime = 0;

      _.each(steps, function(step)
      {
        totalTime += (step.timeOn + step.timeOff) * step.iterations;
      });

      return totalTime;
    }

  });
});
