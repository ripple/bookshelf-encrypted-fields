var assert = require("assert");
var expect = require('chai').expect;

describe('test-get-set', function() {

  var Knex     = require('knex');
  var knex     = require('knex')({client: "sqlite3", connection: { "filename": "test.db" } });
  var bookshelf = require('bookshelf')(knex);
  var plugin = require('../lib/encrypted-fields.js');
  bookshelf.plugin(plugin, {key: 'abcd'});
  var TestModel = null;

  before(function(done) {
    knex.schema.dropTable('test')
    .createTable('test', function (table) {
      table.increments();
      table.string('name');
      table.string('important');
      table.timestamps();

    }).then(function() {
      TestModel = bookshelf.Model.extend({
        tableName: 'test'
      });
      done();
    });

  });

  beforeEach(function(done) {
    knex('test').truncate();
    done();
  })

  it('should return undefined for a get on an empty field', function(done) {
    var m = TestModel.forge({name: 'abc'});
    expect(m.get('important')).to.equal(undefined);
    expect(m.getEncrypted('important')).to.equal(undefined);
    done();
  });

  it('should return an encrypted value when calling get on a setEncrypted', function(done) {
    var m = TestModel.forge({name: 'abc'});
    m.setEncrypted('important', 'toot')
    expect(m.get('important')).to.equal('c5876c15');
    done();
  });

  it('should return the same value when encrypting and decrypting', function(done) {
    var m = TestModel.forge({name: 'abc'});
    m.setEncrypted('important', 'toot');
    expect(m.getEncrypted('important')).to.equal('toot');
    done();
  });



});
