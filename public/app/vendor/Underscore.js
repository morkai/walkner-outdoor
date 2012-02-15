define(['jQuery'], function($)
{
  var underscore = _.noConflict();

  function destructInstance(instance)
  {
    if (instance !== null &&
      typeof instance === 'object' &&
      typeof instance.destroy === 'function')
    {
      instance.destroy();
    }
  }

  underscore.mixin({
    timeout: function(wait, func)
    {
      switch (arguments.length)
      {
        case 2:
          return setTimeout(func, wait);

        case 3:
          return setTimeout(underscore.bind(arguments[2], arguments[1]), wait);
      }
    },
    rand: function(min, max)
    {
      if (typeof min !== 'number')
      {
        min = 0;
      }

      if (typeof max !== 'number')
      {
        max = Number.MAX_VALUE;
      }

      return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    destruct: function(object, propertyN)
    {
      if (arguments.length === 1)
      {
        return destructInstance(object);
      }

      for (var i = 1, l = arguments.length; i < l; ++i)
      {
        var property = arguments[i];
        var instance = object[property];

        if (underscore.isArray(instance) || $.isPlainObject(instance))
        {
          underscore.each(instance, destructInstance);
        }
        else
        {
          destructInstance(instance);
        }

        delete object[property];
      }
    }
  });

  return underscore;
});
