define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/touch',
  'app/user',
  'app/models/Program',
  'app/views/viewport',
  'app/views/EnterPinFormView',
  'app/views/programs/ProgramDetailsView',

  'text!app/templates/dashboard/programPicker.html'
],
/**
 * @param {jQuery} $
 * @param {Underscore} _
 * @param {Backbone} Backbone
 * @param {Object} touch
 * @param {Object} user
 * @param {function(new:Program)} Program
 * @param {Viewport} viewport
 * @param {function(new:EnterPinFormView)} EnterPinFormView
 * @param {function(new:ProgramDetailsView)} ProgramDetailsView
 * @param {String} programPickerTpl
 */
function(
  $,
  _,
  Backbone,
  touch,
  user,
  Program,
  viewport,
  EnterPinFormView,
  ProgramDetailsView,
  programPickerTpl)
{
  /**
   * @class ProgramPickerView
   * @extends Backbone.View
   * @constructor
   * @param {Object} [options]
   */
  var ProgramPickerView = Backbone.View.extend({
    template: _.template(programPickerTpl),
    className: 'programPicker',
    events: {
      'click a.program': 'onClickSelectProgram',
      'click .startProgram': 'onClickStartProgram'
    }
  });

  ProgramPickerView.prototype.initialize = function()
  {
    _.bindAll(this, 'onPinEnterSelectProgram');

    this.onResizeAdjustBoxes = _.debounce(_.bind(this.adjustBoxes, this), 100);

    this.programDetailsView = null;
    this.enterPinFormView = null;
  };

  ProgramPickerView.prototype.destroy = function()
  {
    $(window).off('resize', this.onResizeAdjustBoxes);

    _.destruct(this, 'programDetailsView', 'enterPinFormView');

    this.remove();
  };

  ProgramPickerView.prototype.render = function()
  {
    var data = this.model;
    var isLoggedIn = user.isLoggedIn();
    var canPickProgram = user.isAllowedTo('pickProgram');
    var hasAssignedProgram = _.isObject(data.assignedProgram);

    data.showNoAssignedProgramMessage = !hasAssignedProgram && !isLoggedIn;

    data.showEnterPinForm = hasAssignedProgram && !isLoggedIn;

    data.showAllPrograms = canPickProgram
      && _.isArray(data.allPrograms)
      && data.allPrograms.length;

    data.showAssignedProgram = isLoggedIn
      && hasAssignedProgram
      && !data.showAllPrograms;

    this.el.innerHTML = this.template(data);

    if (data.showEnterPinForm)
    {
      _.destruct(this, 'enterPinFormView');

      this.enterPinFormView = new EnterPinFormView({
        model: {
          zone: this.model.zone,
          action: 'start'
        }
      });
      this.enterPinFormView.onPinEnter = this.onPinEnterSelectProgram;
      this.enterPinFormView.render();

      this.$('.enterPinForm').replaceWith(this.enterPinFormView.el);
    }
    else if (hasAssignedProgram)
    {
      this.renderProgramDetails(new Program(this.model.assignedProgram));
    }

    if (data.showAllPrograms || data.showAssignedProgram)
    {
      $(window).on('resize', this.onResizeAdjustBoxes);

      if (touch.enabled)
      {
        this.$('.allPrograms .list').scrolllistview();
      }
    }

    var self = this;

    _.defer(function()
    {
      self.adjustBoxes();

      if (touch.enabled)
      {
        touch.hideKeyboard();
      }
    });

    return this;
  };

  ProgramPickerView.prototype.onProgramSelect = function(programId, pin) {};

  /**
   * @private
   */
  ProgramPickerView.prototype.adjustBoxes = function()
  {
    var winH = window.innerHeight;
    var contentEl = this.$('.content');
    var contentH = contentEl.outerHeight(true);
    var margin = parseInt(contentEl.css('margin-bottom'));
    var headerH = this.$('h4').outerHeight(true);
    var dataH = winH - contentH - headerH;
    var actionH = this.$('.action').outerHeight(true);

    this.$('.list').height(dataH - margin * 2);
    this.$('.programDetails').height(dataH - margin * 2);
    this.$('.properties').height(dataH - margin * 4 - actionH);
  };

  /**
   * @private
   * @param {Program} program
   */
  ProgramPickerView.prototype.renderProgramDetails = function(program)
  {
    _.destruct(this, 'programDetailsView');

    this.programDetailsView = new ProgramDetailsView({model: program});
    this.programDetailsView.render();

    this.$('.programDetails').append(this.programDetailsView.el);

    if (touch.enabled)
    {
      this.$('.properties').scrolllistview();
    }
  };

  /**
   * @private
   * @param {Object} e
   */
  ProgramPickerView.prototype.onClickSelectProgram = function(e)
  {
    viewport.msg.loading();

    var self = this;

    new Program({_id: $(e.target).attr('data-id')}).fetch({
      success: function(program)
      {
        viewport.msg.hide();

        self.renderProgramDetails(program);
        self.adjustBoxes();
      },
      error: function()
      {
        viewport.msg.loadingFailed();
      }
    });

    e.preventDefault();
  };

  /**
   * @private
   */
  ProgramPickerView.prototype.onClickStartProgram = function()
  {
    this.onProgramSelect(this.programDetailsView.model.id, undefined);
  };

  /**
   * @private
   * @param {String} pin
   */
  ProgramPickerView.prototype.onPinEnterSelectProgram = function(pin)
  {
    this.onProgramSelect(undefined, pin);
  };

  return ProgramPickerView;
});
