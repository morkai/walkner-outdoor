define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/views/viewport',

  'text!app/templates/diag/programDiag.html'
],
function(
  $,
  _,
  Backbone,
  viewport,
  programDiagTpl)
{
  var renderProgramDiag = _.template(programDiagTpl);

  return Backbone.View.extend({

    className: 'box',

    events: {
      'click .stop': 'stopProgram'
    },

    initialize: function()
    {
      var model = this.model;

      if (model._id)
      {
        model.id = model._id;
      }

      var startedAt = moment(model.startedAt);

      model.startTime = startedAt.valueOf();
      model.startedAt = startedAt.format('LLLL');
    },

    destroy: function()
    {
      $(this.el).remove();
      this.el = null;
    },

    render: function()
    {
      this.el.innerHTML = renderProgramDiag(this.model);

      return this;
    },

    stopProgram: function(e)
    {
      var stopEl = this.$('.stop');

      stopEl.attr('disabled', true);

      $.ajax({
        url: '/zones/' + this.model.zoneId,
        type: 'POST',
        data: {action: 'stopProgram'},
        error: function(xhr)
        {
          viewport.msg.show({
            type: 'error',
            time: 2000,
            text: 'Nie udało się zatrzymać programu: ' +
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
