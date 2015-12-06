'use strict';

var fs              = require('fs'),
    config          = require('nconf'),
    assert          = require('assert'),
    PorticoGateway  = require('../lib/infrastructure/portico-gateway'),
    SecureSubmit    = require('../lib/services/secure-submit');

if (fs.statSync('./test/config.json')) {
    config.file({file: './test/config.json'});
}

exports.batch_valid_config = {
    setUp: function (callback) {
        this.PorticoGateway = new PorticoGateway(config.get('validServicesConfig'), config.get('testUri'));
        this.secureSubmit   = new SecureSubmit(this.porticoGateway);
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
