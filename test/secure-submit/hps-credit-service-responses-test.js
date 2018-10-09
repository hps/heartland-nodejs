'use strict';

var fs               = require('fs'),
    config           = require('nconf'),
    assert           = require('assert'),
    util             = require('util'),
    https            = require('https'),
    HpsCreditService = require('../../lib/services/secure-submit/hps-credit-service');

if (fs.statSync('./test/config.json')) {
    config.file({file: './test/config.json'});
}

var skip = true;

var brands = [ 'Visa', 'MasterCard', 'Discover', 'Amex'];
var amounts = {
    Visa: [ 10.34, 10.22, 10.04, 10.25, 10.26, 10.27, 10.28, 10.18,
        10.29, 10.31, 10.03, 10.08, 10.16, 10.17, 10.32, 10.09, 10.10,
        10.11, 10.05, 10.33, 10.30, 10.21, 10.23, 10.35, 10.20, 10.36
    ],
    MasterCard: [ 10.34, 10.22, 10.01, 10.25, 10.26, 10.27, 10.28,
        10.18, 10.31, 10.03, 10.08, 10.32, 10.09, 10.10, 10.19, 10.11,
        10.14, 10.06, 10.33, 10.21
    ],
    Discover: [ 10.34, 10.22, 10.04, 10.25, 10.26, 10.27, 10.28,
        10.18, 10.29, 10.06, 10.31, 10.08, 10.17, 10.32, 10.24, 10.20,
        10.30, 10.09, 10.10, 10.19, 10.11, 10.13, 10.14, 10.33, 10.21
    ],
    Amex: [ 10.08, 10.32, 10.34, 10.22, 10.27, 10.14, 10.23, 10.06,
        10.30, 10.25, 10.13, 10.12, 10.04
    ]
};
var cards = {
    Visa: [ '4853190606714110', '4539121713904874', '4012000000000001' ],
    MasterCard: [ '5570252892527157', '5448144077201692' ],
    Amex: [ '347470722438907', '372229269063066' ],
    Discover: [ '6227368229877480', '6225054529691027' ]
};

exports.credit_responses = {
    setUp: function (callback) {
        this.hpsCreditService   = new HpsCreditService(config.get('validServicesConfig'), config.get('testUri'));
        callback();
    }
};

if (!skip) {
    brands.forEach(function (brand) {
        amounts[brand].forEach(function (amount) {
            exports.credit_responses['chargeResponse_' + brand + '_' + amount] = function (done) {
                this.hpsCreditService.chargeWithCard(amount, 'usd', config.get('valid' + brand),
                    config.get('validCardHolder'), false, null, function (err, result) {
                        assert.equal(result, null, 'response should be null');
                        assert.notEqual(err, null, 'error should not be null');
                        assert.ok(err.message, 'error.message should be present');
                        done();
                    });
            };
            exports.credit_responses['authorizeResponse_' + brand + '_' + amount] = function (done) {
                this.hpsCreditService.authorizeWithCard(amount, 'usd', config.get('valid' + brand),
                    config.get('validCardHolder'), false, null, function (err, result) {
                        assert.equal(result, null, 'response should be null');
                        assert.notEqual(err, null, 'error should not be null');
                        assert.ok(err.message, 'error.message should be present');
                        done();
                    });
            };
        });
        cards[brand].forEach(function (cardNumber) {
            var card = config.get('valid' + brand);
            card.number = cardNumber;
            exports.credit_responses['verifyResponse_' + brand + '_' + cardNumber] = function (done) {
                this.hpsCreditService.verifyWithCard(card,
                    config.get('validCardHolder'), false, function (err, result) {
                        assert.equal(err, null, 'response should be null');
                        assert.notEqual(result, null, 'error should not be null');
                        assert.notEqual(result.responseCode, '00', 'result.responseCode should not be `00`');
                        done();
                    });
            };
        });
    });
}
