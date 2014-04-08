// Copyright (c) 2014, Łukasz Walukiewicz <lukasz@walukiewicz.eu>. Some Rights Reserved.
// Licensed under CC BY-NC-SA 4.0 <http://creativecommons.org/licenses/by-nc-sa/4.0/>.
// Part of the walkner-outdoor project <http://lukasz.walukiewicz.eu/p/walkner-outdoor>

define(
[
  'Underscore'
],
function(_)
{
  var _loadUrl = Backbone.History.prototype.loadUrl;

  _.extend(Backbone.Model.prototype, {
    idAttribute: '_id'
  });

  _.extend(Backbone.Router.prototype, {
    _routeToRegExp: function(route)
    {
      route = route.replace(/[-[\]{}()+?.,\\^$|#\s]/g, "\\$&")
        .replace(/:([\w\d]+)/g, "([^\/][a-zA-Z0-9_-]*)")
        .replace(/\*([\w\d]+)/g, "(.*?)");

      return new RegExp('^' + route + '$');
    }
  });

  _.extend(Backbone.History.prototype, Backbone.Events, {
    back: function()
    {
      window.history.back();
    },
    loadUrl: function(fragmentOverride)
    {
      var matched = _loadUrl.call(this, fragmentOverride);

      if (matched)
      {
        this.trigger('load', this.getFragment());
      }

      return matched;
    }
  });

  return Backbone.noConflict();
});
