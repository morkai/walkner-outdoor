exports.auth = function(privilages)
{
  if (!Array.isArray(privilages))
  {
    privilages = [privilages];
  }

  var l = privilages.length;

  return function(req, res, next)
  {
    var user = req.session.user;

    if (!user || !user.privilages)
    {
      return res.send(401);
    }

    for (var i = 0; i < l; ++i)
    {
      if (!(privilages[i] in user.privilages))
      {
        return res.send(401);
      }
    }

    return next();
  };
};