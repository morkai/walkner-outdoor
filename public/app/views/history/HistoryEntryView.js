define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/views/PageLayout',
  'app/views/viewport',
  'app/views/programs/ProgramStepsTableView',

  'text!app/templates/history/entry.html'
],
function(
  $,
  _,
  Backbone,
  PageLayout,
  viewport,
  ProgramStepsTableView,
  entryTpl)
{
  var renderEntry = _.template(entryTpl);

  return Backbone.View.extend({

    layout: PageLayout,

    breadcrumbs: function()
    {
      return [
        {href: '#history', text: 'Historia'},
        'Wpis'
      ];
    },

    destroy: function()
    {
      this.remove();
    },

    render: function()
    {
      var entry = this.model.toTemplateData();

      this.el.innerHTML = renderEntry({entry: entry});

      if (entry.programSteps.length)
      {
        new ProgramStepsTableView({
          readOnly: true,
          steps: entry.programSteps
        }).replace(this.el);
      }

      return this;
    }
  });
});
