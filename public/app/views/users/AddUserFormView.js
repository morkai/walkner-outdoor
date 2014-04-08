// Copyright (c) 2014, Łukasz Walukiewicz <lukasz@walukiewicz.eu>. Some Rights Reserved.
// Licensed under CC BY-NC-SA 4.0 <http://creativecommons.org/licenses/by-nc-sa/4.0/>.
// Part of the walkner-outdoor project <http://lukasz.walukiewicz.eu/p/walkner-outdoor>

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
/**
 * @param {jQuery} $
 * @param {Underscore} _
 * @param {Backbone} Backbone
 * @param {function(new:User)} User
 * @param {Viewport} viewport
 * @param {function(new:PageLayout)} PageLayout
 * @param {String} formTpl
 */
function(
  $,
  _,
  Backbone,
  User,
  viewport,
  PageLayout,
  formTpl)
{
  /**
   * @class AddUserFormView
   * @constructor
   * @extends Backbone.View
   * @param {Object} [options]
   */
  var AddUserFormView = Backbone.View.extend({
    helpHash: 'users-add',
    template: _.template(formTpl),
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
        text: 'Zapisz',
        className: 'blue save action',
        handler: this.submitForm
      }];
    },
    events: {
      'submit .form': 'submitForm'
    }
  });

  AddUserFormView.prototype.initialize = function()
  {
    _.bindAll(this, 'submitForm');
  };

  AddUserFormView.prototype.destroy = function()
  {
    this.remove();
  };

  AddUserFormView.prototype.render = function()
  {
    var user = this.model.toTemplateData();

    this.el.innerHTML = this.template({
      action: '/users',
      user: user
    });

    return this;
  };

  /**
   * @private
   */
  AddUserFormView.prototype.submitForm = function()
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
          'users/' + user.id, true
        );
      },
      error: function(user, xhr)
      {
        viewport.msg.show({
          type: 'error',
          time: 5000,
          text: 'Nie udało się zapisać nowego użytkownika:<br>'
            + xhr.responseText
        });
      }
    });

    return false;
  };

  return AddUserFormView;
});
