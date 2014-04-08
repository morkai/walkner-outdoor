// Copyright (c) 2014, Łukasz Walukiewicz <lukasz@walukiewicz.eu>. Some Rights Reserved.
// Licensed under CC BY-NC-SA 4.0 <http://creativecommons.org/licenses/by-nc-sa/4.0/>.
// Part of the walkner-outdoor project <http://lukasz.walukiewicz.eu/p/walkner-outdoor>

define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'text!app/templates/list.html'
],
/**
 * @param {jQuery} $
 * @param {Underscore} _
 * @param {Backbone} Backbone
 * @param {String} listTpl
 */
function($, _, Backbone, listTpl)
{
  /**
   * @class ListView
   * @constructor
   * @extends Backbone.View
   * @param {Object} [options]
   */
  var ListView = Backbone.View.extend({
    template: _.template(listTpl)
  });

  ListView.prototype.destroy = function()
  {
    this.remove();
  };

  /**
   * @return {ListView}
   */
  ListView.prototype.render = function()
  {
    this.el.innerHTML = this.template({
      title: this.options.title || 'Lista',
      className: this.options.className || '',
      list: this.getList()
    });

    return this;
  };

  /**
   * @private
   * @return {Array.<Object>}
   */
  ListView.prototype.getList = function()
  {
    if ('list' in this.options)
    {
      return this.options.list;
    }

    if ('collection' in this.options)
    {
      return this.options.collection.map(function(model)
      {
        var href = model.url();

        if (href[0] === '/')
        {
          href = '#' + href.substr(1);
        }

        return {
          text: model.get('name'),
          href: href
        };
      });
    }

    return [];
  };

  return ListView;
});
