define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/models/Programs',
  'app/views/viewport',
  'app/views/programs/ProgramListView',

  'text!app/templates/zones/zone.html'
],
function($, _, Backbone, Programs, viewport, ProgramListView, zoneTpl)
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
        'showProgramList',
        'selectProgram',
        'updateProgress',
        'updateState'
      );

      this.model.bind('change:state', this.updateState);
    },

    destroy: function()
    {
      this.model.unbind('change:state', this.updateState);
      this.remove();
    },

    render: function()
    {
      this.el.innerHTML = renderZone(this.prepareViewData());

      this.updateState();

      return this;
    },

    updateState: function()
    {
      var state = this.model.get('state');

      var zoneEl = this.$('.zone').removeClass('zone-active');
      var ledEl  = zoneEl.find('.zone-led').removeClass('gray green red');

      if (!_.isObject(state))
      {
        ledEl.addClass('gray');

        return;
      }

      if (state.error)
      {
        ledEl.addClass('red');

        return;
      }

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

      var startTime  = state.startTime;
      var totalTime  = state.totalTime * 1000;
      var endTime    = startTime + totalTime;
      var now        = Date.now();
      var completion = (now - startTime) / totalTime * 100;
      var timeToEnd;

      if (completion > 100)
      {
        completion = state.infinite ? completion % 100 : 100;
      }

      if (state.infinite)
      {
        timeToEnd = '\u221E';
      }
      else
      {
        timeToEnd = this.translateEndTime(Math.round((endTime - now) / 1000));
      }

      this.$('.zone-end-time').text(timeToEnd);
      this.$('.zone-bar-value').width(completion.toFixed(2) + '%');
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
      viewport.msg.loading();

      new Programs().fetch({
        data: {
          fields: ['name']
        },
        success: this.showProgramList,
        error: function()
        {
          viewport.msg.loadingFailed();
        }
      });
    },

    stop: function()
    {
      $.ajax({
        url: '/zones/' + this.model.get('_id'),
        type: 'POST',
        data: {action: 'stop'},
        success: function()
        {
          viewport.msg.show({
            type: 'success',
            time: 3000,
            text: 'Strefa zatrzymana pomyślnie!'
          });
        },
        error: function()
        {
          viewport.msg.show({
            type: 'error',
            time: 3000,
            text: 'Nie udało się zatrzymać strefy :('
          });
        }
      });
    },

    showProgramList: function(collection)
    {
      var listView = new ProgramListView({collection: collection});

      listView.selectProgram = this.selectProgram;
      listView.delegateEvents({
        'click a': 'selectProgram'
      });

      viewport.showDialog(listView);
    },

    selectProgram: function(e)
    {
      viewport.closeDialog();

      var href = e.target.href;
      var frag = href.substr(href.indexOf('#') + 1);

      this.startProgram(frag.substr('programs/'.length));

      return false;
    },

    startProgram: function(programId)
    {
      viewport.msg.show({
        delay: 200,
        text : 'Uruchamianie strefy...'
      });

      $.ajax({
        url:  '/zones/' + this.model.get('_id'),
        type: 'POST',
        data: {
          action:  'start',
          program: programId
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
        }
      })
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
    }

  });
});
