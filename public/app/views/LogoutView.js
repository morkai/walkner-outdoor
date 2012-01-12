define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/views/PageLayout',

  'text!app/templates/logoutForm.html'
],
function($, _, Backbone, PageLayout, logoutFormTpl)
{
  var renderLogoutForm = _.template(logoutFormTpl);

  return Backbone.View.extend({

    layout: PageLayout,

    className: 'logout',

    breadcrumbs: ['Wylogowywanie'],

    render: function()
    {
      this.el.innerHTML = renderLogoutForm();

      return this;
    }

  });
});
