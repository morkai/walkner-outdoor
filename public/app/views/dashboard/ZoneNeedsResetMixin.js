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
