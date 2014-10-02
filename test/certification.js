'use strict';

var fs = require('fs'),
    config = require('nconf'),
    HpsBatchService = require('../lib/services/hps-batch-service').HpsBatchService,
    HpsCreditService = require('../lib/services/hps-credit-service').HpsCreditService;

if (fs.statSync('./test/config.json')) {
    config.file({file: './test/config.json'});
}

exports.valid_config = {
    setUp: function (callback) {
        this.hpsBatchService = new HpsBatchService(config.get('validServicesConfig'), config.get('testUri'));
        this.hpsCreditService = new HpsCreditService(config.get('validServicesConfig'), config.get('testUri'));
        callback();
    },
    closeBatch: function (test) {
        this.hpsBatchService.closeBatch(function (err, result) {
            test.notEqual(result, undefined, 'The result should be something.');
            test.equals(err, null, 'Should not return an error.');
            test.done();
        });
    },
    chargeVisa: function (test) {
        this.hpsCreditService.chargeWithCard(17.01, 'usd', config.get('validVisa'),
            config.get('certCardHolderShortZip'), false, null, function (err, result) {
                test.equal(result.responseCode, '00', 'The response code should be "00".');
                test.done();
            });
    },
    chargeMasterCard: function (test) {
        this.hpsCreditService.chargeWithCard(17.02, 'usd', config.get('validMasterCard'),
            config.get('certCardHolderShortZipNoStreet'), false, null, function (err, result) {
                test.equal(result.responseCode, '00', 'The response code should be "00".');
                test.done();
            });
    },
    chargeDiscover: function (test) {
        this.hpsCreditService.chargeWithCard(17.03, 'usd', config.get('validDiscover'),
            config.get('certCardHolderLongZipNoStreet'), false, null, function (err, result) {
                test.equal(result.responseCode, '00', 'The response code should be "00".');
                test.done();
            });
    },
    chargeAmex: function (test) {
        this.hpsCreditService.chargeWithCard(17.04, 'usd', config.get('validAmex'),
            config.get('certCardHolderShortZip'), false, null, function (err, result) {
                test.equal(result.responseCode, '00', 'The response code should be "00".');
                test.done();
            });
    },
    chargeJcb: function (test) {
        this.hpsCreditService.chargeWithCard(17.05, 'usd', config.get('validJcb'),
            config.get('certCardHolderLongZip'), false, null, function (err, result) {
                test.equal(result.responseCode, '00', 'The response code should be "00".');
                test.done();
            });
    },
    verifyVisa: function (test) {
        this.hpsCreditService.verifyWithCard(config.get('validVisa'), null, function (err, result) {
            test.equal(result.responseCode, '85', 'The response code should be "85".');
            test.done();
        });
    },
    verifyMasterCard: function (test) {
        this.hpsCreditService.verifyWithCard(config.get('validMasterCard'), null, function (err, result) {
            test.equal(result.responseCode, '85', 'The response code should be "85".');
            test.done();
        });
    },
    verifyDiscover: function (test) {
        this.hpsCreditService.verifyWithCard(config.get('validDiscover'), null, function (err, result) {
            test.equal(result.responseCode, '85', 'The response code should be "85".');
            test.done();
        });
    },
    avsAmex: function (test) {
        this.hpsCreditService.verifyWithCard(config.get('validDiscover'),
            config.get('certCardHolderShortZipNoStreet'), function (err, result) {
                test.equal(result.responseCode, '85', 'The response code should be "85".');
                test.done();
            });
    },
    refundMasterCard: function (test) {
        this.hpsCreditService.refundWithCard(15.05, 'usd', config.get('validMasterCard'),
            config.get('certCardHolderShortZip'), null, function (err, result) {
                test.notEqual(result.transactionId, undefined, 'The response transaction ID should not be undefined.');
                test.done();
            });
    },
    reverseVisa: function (test) {
        this.hpsCreditService.reverseWithCard(17.01, 'usd', config.get('validVisa'),
            null, function (err, reverseResult) {
                test.notEqual(reverseResult.transactionId, undefined, 'The response transaction ID should not be undefined.');
                test.done();
            });
    }
};