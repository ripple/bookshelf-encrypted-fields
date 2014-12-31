var crypto = require('crypto');
var _ = require('lodash');

// HSM Encryption Middleware -
// Seamlessly encrypt and decrypt data into the database via bookshelf
// -----
module.exports = function(Bookshelf, opts) {
  "use strict";
  var proto  = Bookshelf.Model.prototype;

  // Option validation is cleaner inside an inline function
  var _options = function(_opts) {
    _opts = _opts || {};
    var options = {};
    // Verify a seed or default to empty string
    options.seed = _opts.seed || '';
    // TODO: handle key being a file/buffer
    options.key = _opts.key || '';
    options.cipher = _opts.cipher || '';
    if (crypto.getCiphers().indexOf(options.cipher) === -1) {
      // Default cipher
      options.cipher = 'aes-256-ctr';
    }
    return options;
  }(opts);

  // Setup the Cipher
  var Cipher = function(options) {
    if (_.isString(options.key)) {
      return crypto.createCipher(options.cipher, options.key);
    } else {
      var iv = crypto.createHash('md5').update(options.seed).digest('hex');
      console.log('Cipher', [options.cipher, options.key, iv]);
      return crypto.createCipheriv(options.cipher, options.key, iv);
    }
  };

  // Setup the decipher
  var Decipher = function(options) {
    if (_.isString(options.key)) {
      return crypto.createDecipher(options.cipher, options.key);
    } else {
      var iv = crypto.createHash('md5').update(options.seed).digest('hex');
      console.log('Decipher', [options.cipher, options.key, iv]);
      return crypto.createDecipheriv(options.cipher, options.key, iv);
    }
  };

  var Model = Bookshelf.Model.extend({

    // Set a key in the ORM as encrypted data
    setEncrypted: function(key, val, options) {

      if (key == null) return this;
      var attrs;

      // Handle both `"key", value` and `{key: value}` -style arguments.
      if (typeof key === 'object') {
        attrs = key;
        options = val;
      } else {
        (attrs = {})[key] = val;
      }
      options || (options = {});
      for (var attr in attrs) {
        val = attrs[attr];

        var cipher = Cipher(_options);
        var crypted = cipher.update(val,'utf8','hex')
        crypted += cipher.final('hex');
        attrs[attr] = crypted;

      }

      console.log('Setting', [attrs, options]);

      return this.set(attrs, options);
    },

    // Get a key that was encrypted as plain-text
    getEncrypted: function(key) {

      console.log('Get', key);

      var crypted = this.get(key);

      console.log('Crypted, key', [crypted, key]);

      if (crypted === undefined) {
        return undefined;
      }
      if (crypted === null) {
        return null;
      }

      var decipher = Decipher(_options);
      var plain = decipher.update(crypted,'hex','utf8')
      plain += decipher.final('utf8');
      return plain;
    }

  });
  Bookshelf.Model = Model;
};
