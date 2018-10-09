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
            if (err && (err.message === 'Transaction was rejected because it requires a batch to be open.'
                || err.message === 'Batch close was rejected because no transactions are associated with the currently open batch.')
            ) {
                done();
                return;
            }

            assert.notEqual(result, undefined, 'The result should be something.');
            assert.equal(err, null, 'Should not return an error.');
            done();
        });
    }
};
