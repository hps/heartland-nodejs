'use strict';

var fs = require('fs'),
    config = require('nconf'),
    HpsCreditService = require('../lib/services/hps-credit-service').HpsCreditService;

if (fs.statSync('./test/config.json')) {
    config.file({file: './test/config.json'});
}

exports.valid_config = {
    setUp: function (callback) {
        this.hpsCreditService = new HpsCreditService(config.get('validServicesConfig'), config.get('testUri'));
        callback();
    },
    list_between_today_and_yesterday: function (test) {
        var startDate = new Date(), endDate = new Date();
        startDate.setDate(startDate.getDate() - 1);
        this.hpsCreditService.list(startDate.toISOString(), endDate.toISOString(), null, function (err, result) {
            test.notEqual(result.length, 0, 'The result should be an array with length > 0.');
            test.equals(err, null, 'Should not return an error.');
            test.done();
        });
    },
    get_with_bad_id: function (test) {
        this.hpsCreditService.get(12345, function (err, result) {
            test.equals(result, null, 'The result should be null.');
            test.equals(err.message, 'Report criteria did not produce any results.', 'Should get the correct error message.');
            test.done();
        });
    },
    get_with_good_id: function (test) {
        var startDate = new Date(), endDate = new Date(), that = this;
        startDate.setDate(startDate.getDate() - 1);
        this.hpsCreditService.list(startDate.toISOString(), endDate.toISOString(), null, function (err, result) {
            that.hpsCreditService.get(result[0].transactionId, function (err, result) {
                test.notEqual(result, null, 'The result should not be null.');
                test.done();
            });
        });
    },
    chargeWithValidVisa: function (test) {
        this.hpsCreditService.chargeWithCard(10.00, 'usd', config.get('validVisa'),
            config.get('validCardHolder'), false, null, function (err, result) {
                test.equal(result.responseCode, '00', 'The response code should be "00".');
                test.done();
            });
    },
    chargeWithValidMasterCard: function (test) {
        this.hpsCreditService.chargeWithCard(10.00, 'usd', config.get('validMasterCard'),
            config.get('validCardHolder'), false, null, function (err, result) {
                test.equal(result.responseCode, '00', 'The response code should be "00".');
                test.done();
            });
    },
    authorizeWithValidMasterCard: function (test) {
        this.hpsCreditService.authorizeWithCard(10.00, 'usd', config.get('validMasterCard'),
            config.get('validCardHolder'), false, null, function (err, result) {
                test.equal(result.responseCode, '00', 'The response code should be "00".');
                test.done();
            });
    },
    verifyWithValidMasterCard: function (test) {
        this.hpsCreditService.verifyWithCard(config.get('validMasterCard'),
            config.get('validCardHolder'), function (err, result) {
                test.equal(result.responseCode, '85', 'The response code should be "85".');
                test.done();
            });
    },
    capture: function (test) {
        var that = this;
        this.hpsCreditService.authorizeWithCard(10.00, 'usd', config.get('validMasterCard'),
            config.get('validCardHolder'), false, null, function (err, result) {
                test.equal(result.responseCode, '00', 'The response code should be "00".');
                that.hpsCreditService.capture(result.transactionId, null, function (err, result) {
                    test.equal(result.responseCode, '00', 'The response code should be "00".');
                    test.done();
                });
            });
    },
    refundWithValidMasterCard: function (test) {
        this.hpsCreditService.refundWithCard(10.00, 'usd', config.get('validMasterCard'),
            config.get('validCardHolder'), null, function (err, result) {
                test.notEqual(result.transactionId, undefined, 'The response transaction ID should not be undefined.');
                test.done();
            });
    },
    refundWithValidTransactionId: function (test) {
        var that = this;
        this.hpsCreditService.chargeWithCard(10.00, 'usd', config.get('validVisa'),
            config.get('validCardHolder'), false, null, function (err, getResult) {
                test.equal(getResult.responseCode, '00', 'The response code should be "00".');
                that.hpsCreditService.refundWithTransactionId(10.00, 'usd', getResult.transactionId,
                    config.get('validCardHolder'), null, function (err, refundResult) {
                        test.notEqual(refundResult.transactionId, undefined, 'The response transaction ID should not be undefined.');
                        test.done();
                    });
            });
    },
    reverseWithValidTransactionIdAmountSpecified: function (test) {
        var that = this;
        this.hpsCreditService.chargeWithCard(10.00, 'usd', config.get('validVisa'),
            config.get('validCardHolder'), false, null, function (err, getResult) {
                test.equal(getResult.responseCode, '00', 'The response code should be "00".');
                that.hpsCreditService.reverseWithTransactionId(10.00, 'usd', getResult.transactionId,
                    null, function (err, reverseResult) {
                        test.notEqual(reverseResult.transactionId, undefined, 'The response transaction ID should not be undefined.');
                        test.done();
                    });
            });
    }
};

exports.invalid_config = {
    setUp: function (callback) {
        this.hpsCreditService = new HpsCreditService(config.get('invalidServicesConfig'));
        callback();
    },
    list_between_today_and_yesterday: function (test) {
        var startDate = new Date(), endDate = new Date();
        startDate.setDate(startDate.getDate() - 1);
        this.hpsCreditService.list(startDate.toISOString(), endDate.toISOString(), null, function (err, result) {
            test.notEqual(err.message, null, 'An error should be thrown indicating an authentication problem.');
            test.done();
        });
    }
};