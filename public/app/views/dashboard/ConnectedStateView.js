define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/user',
  'app/views/viewport',
  'app/views/dashboard/ProgramPickerView',

  'text!app/templates/dashboard/connectedState.html'
],
/**
 * @param {jQuery} $
 * @param {Underscore} _
 * @param {Backbone} Backbone
 * @param {Object} user
 * @param {Viewport} viewport
 * @param {function(new:ProgramPickerView)} ProgramPickerView
 * @param {String} connectedStateTpl
 */
function(
  $,
  _,
  Backbone,
  user,
  viewport,
  ProgramPickerView,
  connectedStateTpl)
{
  /**
   * @class ConnectedStateView
   * @constructor
   * @extends Backbone.View
   * @param {Object} [options]
   */
  var ConnectedStateView = Backbone.View.extend({
    tagName: 'div',
    className: 'connected',
    template: _.template(connectedStateTpl),
    events: {
      'click .startProgram': 'showProgramPickerDialog'
    }
  });

  ConnectedStateView.prototype.initialize = function()
  {
    _.bindAll(this, 'showProgramPicker');

    this.model.bind('change:needsReset', this.checkIfNeedsReset, this);
    this.model.bind('change:assignedProgram', this.render, this);
  };

  ConnectedStateView.prototype.destroy = function()
  {
    this.model.unbind('change:needsReset', this.checkIfNeedsReset, this);
    this.model.unbind('change:assignedProgram', this.render, this);

    this.remove();
  };

  /**
   * @return {ConnectedStateView}
   */
  ConnectedStateView.prototype.render = function()
  {
    this.el.innerHTML = this.template(this.model.toJSON());

    this.checkIfNeedsReset();

    if (!user.isAllowedTo('startStop'))
    {
      this.$('.startProgram').hide();
    }

    return this;
  };

  /**
   * @private
   */
  ConnectedStateView.prototype.checkIfNeedsReset = function()
  {
    var needsReset = this.model.get('needsReset');
    var startProgramEl = this.$('.startProgram').hide();
    var actionMessageEl = this.$('.actionMessage');

    if (needsReset)
    {
      actionMessageEl.show();
    }
    else
    {
      actionMessageEl.hide();

      if (user.isAllowedTo('startStop'))
      {
        startProgramEl.show();
      }
    }
  };

  /**
   * @private
   * @param {Object} e
   */
  ConnectedStateView.prototype.showProgramPickerDialog = function(e)
  {
    if (e)
    {
      e.preventDefault();
    }

    this.toggleAction();
    viewport.msg.loading();

    var connectedStateView = this;

    $.ajax({
      type: 'GET',
      url: '/zones/' + this.model.id + '/programs',
      success: this.showProgramPicker,
      error: function()
      {
        connectedStateView.toggleAction();
        viewport.msg.loadingFailed();
      }
    });
  };

  /**
   * @private
   * @param {Object} data
   */
  ConnectedStateView.prototype.showProgramPicker = function(data)
  {
    var connectedStateView = this;
    var programPickerView = new ProgramPickerView({model: data});

    programPickerView.onProgramSelect = function(programId, pin)
    {
      connectedStateView.toggleAction();
      viewport.closeDialog();
      connectedStateView.startProgram(programId, pin);
    };

    viewport.showDialog(programPickerView);

    viewport.bind('dialog:close', function closeDialog()
    {
      connectedStateView.toggleAction();
      viewport.unbind('dialog:close', closeDialog);
    });
  };

  /**
   * @private
   */
  ConnectedStateView.prototype.toggleAction = function()
  {
    var startProgramEl = this.$('.startProgram');

    startProgramEl.attr(
      'disabled', startProgramEl.attr('disabled') ? false : true
    );
  };

  /**
   * @private
   * @param {?String} programId
   * @param {?String} pin
   */
  ConnectedStateView.prototype.startProgram = function(programId, pin)
  {
    var connectedStateView = this;

    viewport.msg.show({
      delay: 200,
      text : 'Uruchamianie programu...'
    });

    $.ajax({
      url:  '/zones/' + this.model.id,
      type: 'POST',
      data: {
        action: 'startProgram',
        program: programId,
        pin: pin
      },
      success: function()
      {
        viewport.msg.show({
          type: 'success',
          time: 3000,
          text: 'Program uruchomiony pomyślnie!'
        });
      },
      error: function(xhr)
      {
        viewport.msg.show({
          type: 'error',
          time: 3000,
          text: 'Nie udało się uruchomić programu' +
                (xhr.responseText ? ': ' + xhr.responseText : ' :(')
        });
      },
      complete: function()
      {
        connectedStateView.toggleAction();
      }
    });
  };

  return ConnectedStateView;
});