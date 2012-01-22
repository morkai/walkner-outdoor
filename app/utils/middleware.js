var guestUser = require('../../config/auth').guestUser;

exports.auth = function(privileges)
{
  if (!Array.isArray(privileges))
  {
    privileges = [privileges];
  }

  var l = privileges.length;

  return function(req, res, next)
  {
    if (!req.session.user)
    {
      req.session.user = guestUser;
    }

    var user = req.session.user;

    if (!user || !user.privileges)
    {
      return res.send(401);
    }

    for (var i = 0; i < l; ++i)
    {
      if (!(privileges[i] in user.privileges))
      {
        return res.send(401);
      }
    }

    return next();
  };
};
