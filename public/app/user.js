define(function()
{
  var user = window && window.USER ? window.USER : {};

  user.isLoggedIn = function()
  {
    return user.loggedIn === true;
  };

  user.isAllowedTo = function(privilage)
  {
    if (!user.privilages)
    {
      return false;
    }

    if (typeof privilage === 'string')
    {
      return privilage in user.privilages;
    }

    var privilages = [].concat(privilage);

    for (var i = 0, l = privilages.length; i < l; ++i)
    {
      privilage = privilages[i];

      if (typeof privilage !== 'string' || privilage in user.privilages)
      {
        continue;
      }

      return false;
    }

    return true;
  };

  return user;
});