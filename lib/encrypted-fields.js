var crypto = require('crypto');
var _ = require('lodash');

/**
 * Setup the cipher
 *
 * @param {Object|String} options or key
 * @return Cipher
 */

function createCipher(options) {
  'use strict';
  if (_.isString(options.key)) {
    return crypto.createCipher(options.cipher, options.key);
  } else {
    var iv = crypto.createHash('md5').update(options.seed).digest('hex');
    return crypto.createCipheriv(options.cipher, options.key, iv);
  }
};

/**
 * Setup the decipher
 *
 * @param {Object|String} options or key
 * @return Decipher
 */

function createDecipher(options) {
  'use strict';
  if (_.isString(options.key)) {
    return crypto.createDecipher(options.cipher, options.key);
  } else {
    var iv = crypto.createHash('md5').update(options.seed).digest('hex');
    return crypto.createDecipheriv(options.cipher, options.key, iv);
  }
};

/**
 * Option validation is cleaner inside an inline function
 * HSM Encryption Middleware -
 * Seamlessly encrypt and decrypt data into the database via bookshelf
 *
 * @param {Object} Bookshelf
 * @param {Object} options
 */

module.exports = function(Bookshelf, opts) {
  'use strict';

  var defaultOptions = {
    seed: '',
    key: 'REPLACEME',
    cipher: 'aes-256-ctr'
  };

  var cipherOptions = _.merge(defaultOptions, opts);

  if (!_.contains(crypto.getCiphers(), cipherOptions.cipher)) {
    throw new Error('Invalid cipher: ' + cipherOptions.cipher);
  }

  var Model = Bookshelf.Model.extend({
    setEncrypted: function(key, val, options) {
      // Set a key in the ORM as encrypted data

      if (key == null) {
        return this;
      }

      var attrs;

      // Handle both `'key', value` and `{key: value}` -style arguments.
      if (typeof key === 'object') {
        attrs = key;
        options = val;
      } else {
        (attrs = { })[key] = val;
      }

      options || (options = { });

      _.forEach(attrs, function(val, attr) {
        var cipher = createCipher(cipherOptions);
        var crypted = cipher.update(val, 'utf8', 'hex')
        crypted += cipher.final('hex');
        attrs[attr] = crypted;
      });

      return this.set(attrs, options);
    },

    getEncrypted: function(key) {
      // Get a key that was encrypted as plain-text

      var encrypted = this.get(key);

      if (encrypted === void(0)) {
        return encrypted;
      }

      if (encrypted === null) {
        return null;
      }

      var decipher = createDecipher(cipherOptions);
      var plaintext = decipher.update(encrypted, 'hex', 'utf8');
      plaintext += decipher.final('utf8');

      return plaintext;
    }
  });

  Bookshelf.Model = Model;
};
