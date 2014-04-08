// Copyright (c) 2014, Łukasz Walukiewicz <lukasz@walukiewicz.eu>. Some Rights Reserved.
// Licensed under CC BY-NC-SA 4.0 <http://creativecommons.org/licenses/by-nc-sa/4.0/>.
// Part of the walkner-outdoor project <http://lukasz.walukiewicz.eu/p/walkner-outdoor>

define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'app/views/viewport',
  'app/views/DeleteView'
],
/**
 * @param {jQuery} $
 * @param {Underscore} _
 * @param {Backbone} Backbone
 * @param {Viewport} viewport
 * @param {function(new:DeleteView)} DeleteView
 */
function($, _, Backbone, viewport, DeleteView)
{
  /**
   * @class DeleteControllerView
   * @extends DeleteView
   * @constructor
   * @param {Object} [options]
   */
  var DeleteControllerView = DeleteView.extend({
    helpHash: 'controllers-delete',
    events: {
      'click .yes.action': 'onButtonClickHandleDelete'
    },
    cancelUrl: function()
    {
      return '#controllers/' + this.model.id;
    },
    message: function()
    {
      return '<p>Czy na pewno chcesz nieodwracalnie usunąć sterownik &lt;' +
             this.model.get('name') + '&gt;?</p>';
    }
  });

  /**
   * @private
   */
  DeleteControllerView.prototype.onButtonClickHandleDelete = function()
  {
    viewport.msg.loading();

    this.model.destroy({
      success: function()
      {
        viewport.msg.show({
          type: 'success',
          time: 5000,
          text: 'Sterownik został usunięty pomyślnie!'
        });

        Backbone.history.navigate('controllers', true);
      },
      error: function(controller, xhr)
      {
        viewport.closeDialog();
        viewport.msg.show({
          type: 'error',
          time: 5000,
          text: xhr.responseText || 'Nie udało się usunąć sterownika :('
        });
      }
    });
  };

  return DeleteControllerView;
});
