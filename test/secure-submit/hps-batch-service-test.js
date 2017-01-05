'use strict';

var fs               = require('fs'),
    config           = require('nconf'),
    assert           = require('assert'),
    HpsBatchService  = require('../../lib/services/secure-submit/hps-batch-service');

if (fs.statSync('./test/config.json')) {
    config.file({file: './test/config.json'});
}

exports.batch_valid_config = {
    setUp: function (callback) {
        this.hpsBatchService = new HpsBatchService(config.get('validServicesConfig'), config.get('testUri'));
        callback();
    },
    closeBatch: function (done) {
        this.hpsBatchService.closeBatch(function (err, result) {
            assert.notEqual(result, undefined, 'The result should be something.');
            assert.equal(err, null, 'Should not return an error.');
            done();
        });
    }
};
