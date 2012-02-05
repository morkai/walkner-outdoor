define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/models/User',
  'app/views/viewport',
  'app/views/PageLayout',

  'text!app/templates/users/form.html'
],
function(
  $,
  _,
  Backbone,
  User,
  viewport,
  PageLayout,
  formTpl)
{
  var renderForm = _.template(formTpl);

  return Backbone.View.extend({

    layout: PageLayout,

    breadcrumbs: function()
    {
      return [
        {href: '#users', text: 'Użytkownicy'},
        'Nowy użytkownik'
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

      return this;
    },

    submitForm: function(e)
    {
      var formEl = this.$('form.user');
      var data   = formEl.toObject({skipEmpty: true}).user || {};
      var error;

      if (!data.name)
      {
        error = 'Imię i nazwisko jest wymagane.';
      }
      else if (!data.email)
      {
        error = 'Adres e-mail jest wymagany.';
      }
      else if (!data.login)
      {
        error = 'Login jest wymagany.';
      }
      else if (data.pin !== '' && data.pin !== data.pin2)
      {
        error = 'Podane PINy muszą być identyczne.';
      }
      else if (data.password !== data.password2)
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
            text: 'Nowy użytkownik został dodany!'
          });

          Backbone.history.navigate(
            'users/' + user.get('_id'), true
          );
        },
        error: function(user, xhr)
        {
          viewport.msg.show({
            type: 'error',
            time: 5000,
            text: 'Nie udało się zapisać nowego użytkownika:<br>' +
                  xhr.responseText
          });
        }
      });

      return false;
    }

  });
});
