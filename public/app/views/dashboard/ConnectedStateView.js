// Copyright (c) 2014, Łukasz Walukiewicz <lukasz@walukiewicz.eu>. Some Rights Reserved.
// Licensed under CC BY-NC-SA 4.0 <http://creativecommons.org/licenses/by-nc-sa/4.0/>.
// Part of the walkner-outdoor project <http://lukasz.walukiewicz.eu/p/walkner-outdoor>

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

    this.model.bind('change:needsReset', this.checkNeeds, this);
    this.model.bind('change:needsPlugIn', this.checkNeeds, this);
    this.model.bind('change:assignedProgram', this.render, this);
  };

  ConnectedStateView.prototype.destroy = function()
  {
    this.model.unbind('change:needsReset', this.checkNeeds, this);
    this.model.unbind('change:needsPlugIn', this.checkNeeds, this);
    this.model.unbind('change:assignedProgram', this.render, this);

    this.remove();
  };

  /**
   * @return {ConnectedStateView}
   */
  ConnectedStateView.prototype.render = function()
  {
    this.el.innerHTML = this.template(this.model.toJSON());

    this.checkNeeds();

    if (!user.isAllowedTo('startStop'))
    {
      this.$('.startProgram').hide();
    }

    return this;
  };

  /**
   * @private
   */
  ConnectedStateView.prototype.checkNeeds = function()
  {
    var needsPlugIn = this.model.get('needsPlugIn');
    var needsReset = this.model.get('needsReset');
    var startProgramEl = this.$('.startProgram').hide();
    var actionMessageEls = this.$('.actionMessage').hide();

    if (needsPlugIn)
    {
      actionMessageEls.filter('.needsPlugIn').show();
    }
    else if (needsReset)
    {
      actionMessageEls.filter('.needsReset').show();
    }
    else
    {
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

    if (this.$('.startProgram').hasClass('disabled'))
    {
      return;
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
    this.$('.startProgram').toggleClass('disabled');
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
      text: 'Uruchamianie programu...'
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
          text: 'Nie udało się uruchomić programu'
            + (xhr.responseText ? ': ' + xhr.responseText : ' :(')
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
