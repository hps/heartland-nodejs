'use strict';

var fs = require('fs'),
    config = require('nconf'),
    HpsBatchService = require('../lib/services/hps-batch-service').HpsBatchService;

if (fs.statSync('./test/config.json')) {
    config.file({file: './test/config.json'});
}

exports.valid_config = {
    setUp: function (callback) {
        this.hpsBatchService = new HpsBatchService(config.get('validServicesConfig'), config.get('testUri'));
        callback();
    },
    closeBatch: function (test) {
        this.hpsBatchService.closeBatch(function (err, result) {
            test.notEqual(result, undefined, 'The result should be something.');
            test.equals(err, null, 'Should not return an error.');
            test.done();
        });
    }
};