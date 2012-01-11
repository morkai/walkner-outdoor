define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/views/viewport',
  'app/views/PageLayout',

  'text!app/templates/users/form.html'
],
function(
  $,
  _,
  Backbone,
  viewport,
  PageLayout,
  formTpl)
{
  var renderForm = _.template(formTpl);

  return Backbone.View.extend({

    layout: PageLayout,

    breadcrumbs: function()
    {
      var model = this.model;

      return [
        {href: '#users', text: 'Użytkownicy'},
        {href: '#users/' + model.get('_id'), text: model.get('name')},
        {text: 'Edycja'}
      ];
    },

    actions: function()
    {
      return [{
        text     : 'Zapisz',
        className: 'blue save action',
        handler  : this.submitForm
      }];
    },

    events: {
      'submit .form' : 'submitForm'
    },

    initialize: function()
    {
      _.bindAll(this, 'submitForm');
    },

    destroy: function()
    {
      this.remove();
    },

    render: function()
    {
      var user = this.model.toTemplateData();

      this.el.innerHTML = renderForm({
        action: '/users',
        user  : user
      });

      this.$('form').fromObject({user: user});

      this.$('label[for="user-password"]').text('Nowe hasło');
      this.$('label[for="user-password2"] .required').hide();
      this.$('label[for="user-pin"]').text('Nowy PIN');

      return this;
    },

    submitForm: function(e)
    {
      var formEl = this.$('form.user');
      var data   = formEl.toObject({skipEmpty: true}).user || {};
      var error;

      if (data.pin !== '' && data.pin !== data.pin2)
      {
        error = 'Podane PINy muszą być identyczne.';
      }

      if (data.password !== '' && data.password !== data.password2)
      {
        error = 'Podane hasła muszą być identyczne.';
      }

      if (error)
      {
        viewport.msg.show({
          type: 'error',
          time: 2000,
          text: error
        });

        return false;
      }

      this.model.save(data, {
        success: function(user)
        {
          viewport.msg.show({
            type: 'success',
            time: 5000,
            text: 'Użytkownik został zmodyfikowany pomyślnie!'
          });

          Backbone.history.navigate(
            'users/' + user.get('_id'), true
          );
        },
        error: function()
        {
          viewport.msg.show({
            type: 'error',
            time: 5000,
            text: 'Nie udało się zmodyfikować użytkownika :('
          });
        }
      });

      return false;
    }

  });
});
