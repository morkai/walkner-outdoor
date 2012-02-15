define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/views/viewport',
  'app/views/PageLayout',

  'text!app/templates/users/form.html'
],
/**
 * @param {jQuery} $
 * @param {Underscore} _
 * @param {Backbone} Backbone
 * @param {Viewport} viewport
 * @param {function(new:PageLayout)} PageLayout
 * @param {String} formTpl
 */
function(
  $,
  _,
  Backbone,
  viewport,
  PageLayout,
  formTpl)
{
  /**
   * @class EditUserFormView
   * @constructor
   * @extends Backbone.View
   * @param {Object} [options]
   */
  var EditUserFormView = Backbone.View.extend({
    template: _.template(formTpl),
    layout: PageLayout,
    breadcrumbs: function()
    {
      var model = this.model;

      return [
        {href: '#users', text: 'Użytkownicy'},
        {href: '#users/' + model.id, text: model.get('name')},
        {text: 'Edycja'}
      ];
    },
    actions: function()
    {
      return [{
        text: 'Zapisz',
        className: 'blue save action',
        handler: this.submitForm
      }];
    },
    events: {
      'submit .form': 'submitForm'
    }
  });

  EditUserFormView.prototype.initialize = function()
  {
    _.bindAll(this, 'submitForm');
  };

  EditUserFormView.prototype.destroy = function()
  {
    this.remove();
  };

  EditUserFormView.prototype.render = function()
  {
    var user = this.model.toTemplateData();

    this.el.innerHTML = this.template({
      action: '/users',
      user: user
    });

    this.$('form').fromObject({user: user});

    this.$('label[for="user-password"]').text('Nowe hasło');
    this.$('label[for="user-password2"] .required').hide();
    this.$('label[for="user-pin"]').text('Nowy PIN');

    return this;
  };

  /**
   * @private
   * @return {Boolean}
   */
  EditUserFormView.prototype.submitForm = function()
  {
    var formEl = this.$('form.user');
    var data = formEl.toObject({skipEmpty: true}).user || {};
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
    else if (data.password !== '' && data.password !== data.password2)
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
          'users/' + user.id, true
        );
      },
      error: function(user, xhr)
      {
        viewport.msg.show({
          type: 'error',
          time: 5000,
          text: 'Nie udało się zmodyfikować użytkownika: ' + xhr.responseText
        });
      }
    });

    return false;
  };

  return EditUserFormView;
});
