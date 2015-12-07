'use strict';

var fs              = require('fs'),
    config          = require('nconf'),
    assert          = require('assert'),
    SecureSubmit    = require('../lib/services/secure-submit');

if (fs.statSync('./test/config.json')) {
    config.file({file: './test/config.json'});
}

exports.certification_valid_config = {
    setUp: function (callback) {
        this.secureSubmit   = new SecureSubmit(config.get('validServicesConfig'), config.get('testUri'));
        callback();
    },
    chargeVisa: function (done) {
        this.secureSubmit.chargeWithCard(17.01, 'usd', config.get('validVisa'),
            config.get('certCardHolderShortZip'), false, null, function (err, result) {
                assert.equal(result.responseCode, '00', 'The response code should be "00".');
                done();
            });
    },
    chargeMasterCard: function (done) {
        this.secureSubmit.chargeWithCard(17.02, 'usd', config.get('validMasterCard'),
            config.get('certCardHolderShortZipNoStreet'), false, null, function (err, result) {
                assert.equal(result.responseCode, '00', 'The response code should be "00".');
                done();
            });
    },
    chargeDiscover: function (done) {
        this.secureSubmit.chargeWithCard(17.03, 'usd', config.get('validDiscover'),
            config.get('certCardHolderLongZipNoStreet'), false, null, function (err, result) {
                assert.equal(result.responseCode, '00', 'The response code should be "00".');
                done();
            });
    },
    chargeAmex: function (done) {
        this.secureSubmit.chargeWithCard(17.04, 'usd', config.get('validAmex'),
            config.get('certCardHolderShortZip'), false, null, function (err, result) {
                assert.equal(result.responseCode, '00', 'The response code should be "00".');
                done();
            });
    },
    chargeJcb: function (done) {
        this.secureSubmit.chargeWithCard(17.05, 'usd', config.get('validJcb'),
            config.get('certCardHolderLongZip'), false, null, function (err, result) {
                assert.equal(result.responseCode, '00', 'The response code should be "00".');
                done();
            });
    },
    verifyVisa: function (done) {
        this.secureSubmit.verifyWithCard(config.get('validVisa'), null, false, function (err, result) {
            assert.equal(result.responseCode, '85', 'The response code should be "85".');
            done();
        });
    },
    verifyMasterCard: function (done) {
        this.secureSubmit.verifyWithCard(config.get('validMasterCard'), null, false, function (err, result) {
            assert.equal(result.responseCode, '85', 'The response code should be "85".');
            done();
        });
    },
    verifyDiscover: function (done) {
        this.secureSubmit.verifyWithCard(config.get('validDiscover'), null, false, function (err, result) {
            assert.equal(result.responseCode, '85', 'The response code should be "85".');
            done();
        });
    },
    avsAmex: function (done) {
        this.secureSubmit.verifyWithCard(config.get('validAmex'),
            config.get('certCardHolderShortZipNoStreet'), false, function (err, result) {
                assert.equal(result.responseCode, '00', 'The response code should be "00".');
                done();
            });
    },
    refundMasterCard: function (done) {
        this.secureSubmit.refundWithCard(15.05, 'usd', config.get('validMasterCard'),
            config.get('certCardHolderShortZip'), null, function (err, result) {
                assert.notEqual(result.transactionId, undefined, 'The response transaction ID should not be undefined.');
                done();
            });
    },
    reverseVisa: function (done) {
        this.secureSubmit.reverseWithCard(17.01, 'usd', config.get('validVisa'),
            null, function (err, reverseResult) {
                assert.notEqual(reverseResult.transactionId, undefined, 'The response transaction ID should not be undefined.');
                done();
            });
    },
    closeBatch: function (done) {
        this.secureSubmit.closeBatch(function (err, result) {
            assert.notEqual(result, undefined, 'The result should be something.');
            assert.equal(err, null, 'Should not return an error.');
            done();
        });
    }
};
