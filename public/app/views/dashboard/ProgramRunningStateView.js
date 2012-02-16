define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/time',
  'app/user',
  'app/models/Program',
  'app/views/viewport',
  'app/views/EnterPinFormView',

  'text!app/templates/dashboard/programRunningState.html'
],
/**
 * @param {jQuery} $
 * @param {Underscore} _
 * @param {Backbone} Backbone
 * @param {Object} time
 * @param {Object} user
 * @param {function(new:Program)} Program
 * @param {Viewport} viewport
 * @param {function(new:EnterPinFormView)} EnterPinFormView
 * @param {String} programRunningStateTpl
 */
function(
  $,
  _,
  Backbone,
  time,
  user,
  Program,
  viewport,
  EnterPinFormView,
  programRunningStateTpl)
{
  /**
   * @class ProgramRunningStateView
   * @constructor
   * @extends Backbone.View
   * @param {Object} [options]
   */
  var ProgramRunningStateView = Backbone.View.extend({
    tagName: 'div',
    className: 'programRunning',
    template: _.template(programRunningStateTpl),
    events: {
      'click .programPreview': 'onProgramPreviewClick',
      'click .stopProgram': 'showStopProgramDialog'
    }
  });

  ProgramRunningStateView.prototype.initialize = function()
  {
    _.bindAll(this, 'stopProgram', 'updateProgress');

    this.timers = {};
    this.programPreviewView = null;

    this.model.bind('change:progress', this.updateProgress);
  };

  ProgramRunningStateView.prototype.destroy = function()
  {
    for (var timer in this.timers)
    {
      clearTimeout(this.timers[timer]);
    }

    this.model.unbind('change:progress', this.updateProgress);

    if (this.programPreviewView)
    {
      viewport.closeDialog();
    }

    this.remove();
  };

  /**
   * @return {ProgramRunningStateView}
   */
  ProgramRunningStateView.prototype.render = function()
  {
    this.el.innerHTML = this.template(this.model.toJSON());

    if (!user.isAllowedTo('startStop'))
    {
      this.$('.stopProgram').hide();
    }

    this.totalTime = this.model.get('program').totalTime;
    this.remainingTime = this.calcRemainingTime();

    this.updateProgressBar();

    return this;
  };

  /**
   * @private
   */
  ProgramRunningStateView.prototype.showStopProgramDialog = function()
  {
    if (user.isLoggedIn())
    {
      return this.stopProgram();
    }

    this.enterPinFormView = new EnterPinFormView({
      model: {
        zone: {id: this.model.id, name: this.model.get('name')},
        action: 'stop'
      }
    });
    this.enterPinFormView.onPinEnter = this.stopProgram;
    this.enterPinFormView.render();

    viewport.showDialog(this.enterPinFormView);

    var programName = this.model.get('state').programName;
    var zoneName = this.model.get('name');

    $(this.enterPinFormView.el).prepend(
      '<p class="content">Jeżeli chcesz zatrzymać program<br><strong>&lt;' +
      programName + '&gt;</strong><br>na strefie<br><strong>&lt;' +
      zoneName + '&gt;</strong><br>to podaj swój PIN i wciśnij przycisk' +
      ' <em>Stop</em>.</p>'
    );
  }

  /**
   * @private
   * @param {String} [pin]
   */
  ProgramRunningStateView.prototype.stopProgram = function(pin)
  {
    this.toggleAction();

    var programRunningStateView = this;

    $.ajax({
      url: '/zones/' + this.model.id,
      type: 'POST',
      data: {action: 'stopProgram', pin: pin},
      success: function()
      {
        viewport.msg.show({
          type: 'success',
          time: 3000,
          text: 'Program zatrzymany pomyślnie!'
        });
      },
      error: function(xhr)
      {
        viewport.msg.show({
          type: 'error',
          time: 3000,
          text: xhr.responseText || 'Nie udało się zatrzymać programu :('
        });
      },
      complete: function()
      {
        programRunningStateView.toggleAction();
        viewport.closeDialog();
      }
    });
  };

  /**
   * @private
   */
  ProgramRunningStateView.prototype.toggleAction = function()
  {
    var stopProgramEl = this.$('.stopProgram');

    stopProgramEl.attr(
      'disabled', stopProgramEl.attr('disabled') ? false : true
    );
  };

  /**
   * @private
   */
  ProgramRunningStateView.prototype.calcRemainingTime = function()
  {
    var program = this.model.get('program');
    var progress = this.model.get('progress');

    var endTime = progress
      ? progress.endTime - time.offset
      : program.startTime + (program.totalTime * 1000);

    var remainingTime = Math.floor((endTime - Date.now()) / 1000);

    return remainingTime;
  };

  /**
   * @private
   */
  ProgramRunningStateView.prototype.updateProgress = function()
  {
    clearTimeout(this.timers.updateProgressBar);

    this.remainingTime = this.model.get('progress').remainingTime;

    this.updateProgressBar();
    this.updateProgramPreviewProgress();
  };

  /**
   * @private
   */
  ProgramRunningStateView.prototype.updateProgressBar = function(src)
  {
    var programRunningStateView = this;

    this.timers.updateProgressBar = _.timeout(1000, function()
    {
      programRunningStateView.remainingTime -= 1;
      programRunningStateView.updateProgressBar();
    });

    var timeToEnd = Program.calcDuration(this.remainingTime);

    if (timeToEnd === '')
    {
      return;
    }

    var program = this.model.get('program');

    if (program.infinite)
    {
      timeToEnd += ' \u221E ' + Program.calcDuration(
        (Date.now() - (program.startTime - time.offset)) / 1000
      );
    }

    this.$('.timeToEnd').text(timeToEnd);

    var completion = 100 - (this.remainingTime * 100 / this.totalTime);
    var progressValueEl = this.$('.progressValue');

    if (completion < 1)
    {
      progressValueEl.hide();
    }
    else
    {
      progressValueEl.css('width', completion.toFixed(2) + '%').show();
    }
  };

  /**
   * @private
   */
  ProgramRunningStateView.prototype.updateProgramPreviewProgress = function()
  {
    if (!this.programPreviewView)
    {
      return;
    }

    var programStepsEl = this.programPreviewView.$('.program-steps tbody');

    if (!programStepsEl.length)
    {
      return;
    }

    var progress = this.model.get('progress');

    var stepsEl = programStepsEl.children();

    stepsEl.find('.iterations').each(function(stepIndex)
    {
      var iterationsEl = $(this);

      var match = iterationsEl.val().match(/([0-9]+)(?:\/([0-9]+))?/);
      var iterations = match[2] === undefined ? match[1] : match[2];

      if (stepIndex < progress.stepIndex)
      {
        iterationsEl.val(iterations + '/' + iterations);
      }
      else if (stepIndex === progress.stepIndex)
      {
        iterationsEl.val((progress.stepIteration + 1) + '/' + iterations);
      }
      else
      {
        iterationsEl.val('0/' + iterations);
      }
    });

    stepsEl.find('.focused').removeClass('focused');
    stepsEl
      .eq(progress.stepIndex)
      .find(progress.state === 'on' ? '.timeOn' : '.timeOff')
        .addClass('focused');
  };

  /**
   * @private
   * @param {Object} e
   */
  ProgramRunningStateView.prototype.onProgramPreviewClick = function(e)
  {
    if (e.button !== 0)
    {
      return;
    }

    var programRunningStateView = this;

    viewport.bind('dialog:show', function onDialogShow(programPreviewView)
    {
      programRunningStateView.programPreviewView = programPreviewView;
      programRunningStateView.updateProgramPreviewProgress();

      viewport.unbind('dialog:show', onDialogShow);
    });
    viewport.bind('dialog:close', function onDialogClose()
    {
      programRunningStateView.programPreviewView = null;

      viewport.unbind('dialog:close', onDialogClose);
    });
  };

  return ProgramRunningStateView;
});
