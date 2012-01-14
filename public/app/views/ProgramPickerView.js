define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/user',
  'app/views/EnterPinFormView',

  'text!app/templates/programPicker.html'
],
function(
  $,
  _,
  Backbone,
  user,
  EnterPinFormView,
  programPickerTpl)
{
  var renderProgramPicker = _.template(programPickerTpl);

  return Backbone.View.extend({

    className: 'programPicker',

    events: {
      'click a.program': 'onClickSelectProgram'
    },

    initialize: function()
    {
      _.bindAll(this, 'onPinEnterSelectProgram');

      this.adjustBoxes = _.debounce(_.bind(this.adjustBoxes, this), 100);

      $(window).on('resize', this.adjustBoxes);
    },

    destroy: function()
    {
      $(window).off('resize', this.adjustBoxes);

      _.destruct(this, 'enterPinFormView');

      this.remove();
    },

    render: function()
    {
      var data               = this.model;
      var isLoggedIn         = user.isLoggedIn();
      var canPickProgram     = user.isAllowedTo('pickProgram');
      var hasAssignedProgram = _.isObject(data.assignedProgram);

      data.showNoAssignedProgramMessage = !hasAssignedProgram && !isLoggedIn;

      data.showEnterPinForm = hasAssignedProgram && !isLoggedIn;

      data.showAssignedProgram = hasAssignedProgram && isLoggedIn;

      data.showRecentPrograms = canPickProgram
                                && _.isArray(data.recentPrograms)
                                && data.recentPrograms.length;

      data.showAllPrograms = canPickProgram
                             && _.isArray(data.allPrograms)
                             && data.allPrograms.length;

      this.el.innerHTML = renderProgramPicker(data);

      this.adjustBoxes();

      if (data.showEnterPinForm)
      {
        this.enterPinFormView = new EnterPinFormView({
          model: {
            zone  : this.model.zone,
            action: 'start'
          }
        });
        this.enterPinFormView.onPinEnter = this.onPinEnterSelectProgram;
        this.enterPinFormView.render();

        this.$('.enterPinForm').replaceWith(this.enterPinFormView.el);
      }

      return this;
    },

    adjustBoxes: function()
    {
      var allProgramsBoxEl     = this.$('.allPrograms');
      var allProgramsHdHeight  = allProgramsBoxEl.find('h4').outerHeight(true);
      var allProgramsListEl    = allProgramsBoxEl.find('.list').height('auto');
      var allProgramsBoxHeight = allProgramsBoxEl.outerHeight(true);

      if (window.innerWidth <= 1280)
      {
        return;
      }

      if (window.innerHeight < allProgramsBoxHeight)
      {
        allProgramsListEl.height(window.innerHeight - allProgramsHdHeight * 2);
      }
    },

    onClickSelectProgram: function(e)
    {
      e.preventDefault();

      var programId = $(e.target).attr('data-id');

      this.onProgramSelect(programId, undefined);
    },

    onPinEnterSelectProgram: function(pin)
    {
      this.onProgramSelect(undefined, pin);
    },

    onProgramSelect: function(programId, pin) {}

  });
});
