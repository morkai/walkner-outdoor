var config = require('../../config/auth');

app.post('/login', function(req, res, next)
{
  var credentials = req.body;

  if (credentials.login === config.superUser.login)
  {
    if (credentials.password !== config.superUser.password)
    {
      return res.send(401);
    }

    return req.session.regenerate(function(err)
    {
      if (err)
      {
        return next(err);
      }

      req.session.user = config.superUser;

      if (req.is('json'))
      {
        res.send(req.session.user);
      }
      else
      {
        res.redirect('home');
      }
    });
  }

  var User = app.db.model('User');

  User.findOne({login: credentials.login}, function(err, user)
  {
    if (err)
    {
      return next(err);
    }

    if (!user)
    {
      return res.send(401);
    }

    var client = User.hashPassword(
      credentials.password, user.passwordSalt
    );

    if (client.hash !== user.password)
    {
      return res.send(401);
    }

    req.session.regenerate(function(err)
    {
      if (err)
      {
        return next(err);
      }

      req.session.user = user.toJSON();
      req.session.user.loggedIn = true;

      if (req.is('json'))
      {
        res.send(req.session.user);
      }
      else
      {
        res.redirect('home');
      }
    });
  });
});

app.post('/logout', function(req, res, next)
{
  req.session.destroy(function(err)
  {
    if (err)
    {
      return next(err);
    }

    if (req.is('json'))
    {
      res.send(200);
    }
    else
    {
      res.redirect('home');
    }
  });
});
