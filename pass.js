/**
 * Module dependencies.
 */

var crypto = require('crypto');

/**
 * Hashes a password with optional `salt`, otherwise
 * generate a salt for `pass` and invoke `fn(err, salt, hash)`.
 *
 * @param {String} password to hash
 * @param {String} optional salt
 * @param {Function} callback
 * @api public
 */

exports.hash = function(pwd, salt, fn) {

var len = 128;//Bytesize
var iterations = 12000;//Iterations. ~300ms

  if (3 == arguments.length) {
    crypto.pbkdf2(pwd, salt, iterations, len, function(err, hash){
      fn(err, hash.toString('base64'));
    });
  } else {
    fn = salt;
    crypto.randomBytes(len, function(err, salt){
      if (err) return fn(err);
      salt = salt.toString('base64');
      crypto.pbkdf2(pwd, salt, iterations, len, function(err, hash){
        if (err) return fn(err);
        fn(null, salt, hash.toString('base64'));
      });
    });
  }
};

exports.initUsers = function(){
  // dummy database - plain object
  var users = {
    Gilles: { name: 'Gilles' }
  };
  // when I create a user, generate a salt
  // and hash the password ('password' is the pass here)
  this.hash('password', function(err, salt, hash){
    if (err) throw err;
    // store the salt & hash in the "db"
    users.Gilles.salt = salt;
    users.Gilles.hash = hash;
  });

  exports.users=users;
};



// Authenticate using my plain-object

exports.authenticate = function(name, pass, fn) {
  if (!module.parent) console.log('authenticating %s:%s', name, pass);
  var user = this.users[name];
  // query the 'db' for the given username
  if (!user) return fn(new Error('cannot find user'));
  // apply the same algorithm to the POSTed password, applying
  // the hash against the pass / salt, if there is a match we
  // found the user
  this.hash(pass, user.salt, function(err, hash){
    if (err) return fn(err);
    if (hash == user.hash) return fn(null, user);
    fn(new Error('invalid password'));
  });
}


