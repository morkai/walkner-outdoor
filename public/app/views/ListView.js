define(
[
  'jQuery',
  'Underscore',
  'Backbone',

  'text!app/templates/list.html'
],
function($, _, Backbone, listTpl)
{
  var renderList = _.template(listTpl);

  return Backbone.View.extend({

    destroy: function()
    {
      this.remove();
    },

    render: function()
    {
      this.el.innerHTML = renderList({
        title: this.options.title || 'Lista',
        className: this.options.className || '',
        list: this.getList()
      });

      return this;
    },

    getList: function()
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
    }

  });
});
