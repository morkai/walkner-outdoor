define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/views/viewport',
  'app/views/PageLayout',

  'text!app/templates/diag.html'
],
function(
  $,
  _,
  Backbone,
  viewport,
  PageLayout,
  diagTpl)
{
  var renderDiag = _.template(diagTpl);

  return Backbone.View.extend({

    layout: PageLayout,

    className: 'diag',

    breadcrumbs: function()
    {
      return [
        'Diagnostyka'
      ];
    },

    destroy: function()
    {
      $(this.el).remove();
      this.el = null;
    },

    render: function()
    {
      this.el.innerHTML = renderDiag({diag: this.model});

      return this;
    }

  });
});
