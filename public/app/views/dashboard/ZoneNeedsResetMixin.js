// Copyright (c) 2014, Łukasz Walukiewicz <lukasz@walukiewicz.eu>. Some Rights Reserved.
// Licensed under CC BY-NC-SA 4.0 <http://creativecommons.org/licenses/by-nc-sa/4.0/>.
// Part of the walkner-outdoor project <http://lukasz.walukiewicz.eu/p/walkner-outdoor>

define(
[
  'jQuery',

  'app/user'
],
/**
 * @param {jQuery} $
 * @param {Object} user
 */
function($, user)
{
  return {
    toggleResetAction: function()
    {
      if (!this.model.get('needsReset'))
      {
        this.$('.needsReset').hide();

        if (user.isAllowedTo('startStop'))
        {
          this.$('.resetZone').show();
        }
      }
      else
      {
        this.$('.resetZone').hide();
        this.$('.needsReset').show();
      }
    },
    resetZone: function()
    {
      var $resetZone = this.$('.resetZone');

      if ($resetZone.hasClass('disabled'))
      {
        return;
      }

      $resetZone.addClass('disabled');

      $.ajax({
        type: 'POST',
        url: '/zones/' + this.model.id,
        data: {action: 'reset'},
        error: function()
        {
          $resetZone.removeClass('disabled');
        }
      });
    }
  };
});
