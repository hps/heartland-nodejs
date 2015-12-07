'use strict';

var fs              = require('fs'),
    config          = require('nconf'),
    assert          = require('assert'),
    SecureSubmit    = require('../lib/services/secure-submit');

if (fs.statSync('./test/config.json')) {
    config.file({file: './test/config.json'});
}

exports.batch_valid_config = {
    setUp: function (callback) {
        this.secureSubmit   = new SecureSubmit(config.get('validServicesConfig'), config.get('testUri'));
        callback();
    },
    closeBatch: function (done) {
        this.secureSubmit.closeBatch(function (err, result) {
            assert.notEqual(result, undefined, 'The result should be something.');
            assert.equal(err, null, 'Should not return an error.');
            done();
        });
    }
};
