var createHash = require('crypto').createHash;
var _ = require('underscore');
var mongoose = require('mongoose');

var User = module.exports = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  login: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  passwordSalt: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true,
    trim: true
  },
  pin: {
    type: Number,
    unique: true
  },
  privileges: {
    type: {}
  }
}, {
  strict: true
});

User.statics.hashPassword = function(password, salt)
{
  if (!salt)
  {
    salt = createHash('sha1')
      .update(Date.now().toString())
      .update(Math.random().toString())
      .digest('hex');
  }

  var hash = createHash('sha256')
    .update(salt)
    .update(password)
    .digest('hex');

  return {
    salt: salt,
    hash: hash
  };
};

User.methods.toJSON = function()
{
  var obj = mongoose.Model.prototype.toJSON.call(this);

  delete obj.password;
  delete obj.passwordSalt;
  delete obj.pin;

  return obj;
};

mongoose.model('User', User);
