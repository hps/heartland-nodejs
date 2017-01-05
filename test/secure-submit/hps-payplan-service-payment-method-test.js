'use strict';

var fs                       = require('fs'),
    config                   = require('nconf'),
    assert                   = require('assert'),
    util                     = require('util'),
    _                        = require('lodash'),
    https                    = require('https'),
    HpsPayPlanService        = require('../../lib/services/secure-submit/hps-payplan-service'),
    HpsPayPlanPaymentMethodDuration = require('../../lib/infrastructure/enums').PayPlan.HpsPayPlanPaymentMethodDuration,
    HpsPayPlanPaymentMethodFrequency = require('../../lib/infrastructure/enums').PayPlan.HpsPayPlanPaymentMethodFrequency,
    HpsPayPlanPaymentMethodStatus = require('../../lib/infrastructure/enums').PayPlan.HpsPayPlanPaymentMethodStatus;

if (fs.statSync('./test/config.json')) {
    config.file({file: './test/config.json'});
}

function getToken(card, callback) {
    var url = 'https://cert.api2.heartlandportico.com/Hps.Exchange.PosGateway.Hpf.v1/api/token' +
                '?token_type=supt' +
                '&object=token' +
                '&_method=post' +
                '&api_key=' + config.get('validServicesConfig').publicApiKey +
                '&card%5Bnumber%5D=' + card.number +
                '&card%5Bexp_month%5D=' + card.expMonth +
                '&card%5Bexp_year%5D=' + card.expYear +
                '&card%5Bcvc%5D=' + card.cvv;

    https.get(url, function (resp) {
        var str = '';
        resp.on('data', function (data) {
            str += data;
        });

        resp.on('end', function () {
            callback(JSON.parse(str));
        });
    });
}

function getIdentifier(id) {
    var date = new Date()
        .toISOString()
        .split('T', 1)[0]
        .replace(/\-/g, '');
    var base = '%s-%s-' + _.shuffle('abcdefghijklmnopqrstuvwxyz').slice(0, 10).join('');
    return util.format(base, date, id);
}

function makePaymentMethodObject(customer) {
    return {
        customerKey: customer.customerKey,
        nameOnAccount: 'Bill Johnson',
        country: 'USA'
    };
}

var self;
exports.payplan_payment_methods_valid_config = {
    setUp: function (done) {
        self = this;
        this.hpsPayPlanService = new HpsPayPlanService(config.get('validPayPlanConfig'), false);
        this.hpsPayPlanService.page(1, 0).findAllCustomers(
            {customerIdentifier: 'SecureSubmit'},
            function (err, result) {
                assert.equal(err, null);
                assert.ok(result);
                assert.ok(result.results);
                assert.notEqual(result.results.length, 0);
                self.customer = result.results[0];
                done();
            }
        );
    },
    addPaymentMethod: function (done) {
        var paymentMethod = makePaymentMethodObject(self.customer);
        paymentMethod.accountNumber = '4111111111111111';
        paymentMethod.expirationDate = '0120';
        self.hpsPayPlanService.addPaymentMethod(paymentMethod, function (err, result) {
            assert.equal(err, null, 'Should not return an error.');
            assert.ok(result, 'The result should be something.');
            assert.ok(result.paymentMethodKey);
            done();
        });
    },
    addPaymentMethodWithSingleUseToken: function (done) {
        getToken(config.get('validMasterCard'), function (token) {
            var paymentMethod = makePaymentMethodObject(self.customer);
            paymentMethod.paymentToken = token.token_value;
            self.hpsPayPlanService.addPaymentMethod(paymentMethod, function (err, result) {
                assert.equal(err, null, 'Should not return an error.');
                assert.ok(result, 'The result should be something.');
                assert.ok(result.customerKey);
                done();
            });
        });
    },
    addPaymentMethodNull: function (done) {
        self.hpsPayPlanService.addPaymentMethod(null, function (err, result) {
            assert.ok(err, 'There should be something for `err`.');
            assert.equal(result, null, 'The result should be null.');
            done();
        });
    },
    editPaymentMethod: function (done) {
        // Get customer
        self.hpsPayPlanService.findAllPaymentMethods({customerIdentifier: 'SecureSubmit'},
            function (err, result) {
                assert.equal(err, null, 'Should not return an error.');
                assert.ok(result);
                assert.ok(result.results);
                assert.notEqual(result.results.length, 0);

                var paymentMethod = result.results[0];
                var paymentStatus = paymentMethod.paymentStatus === HpsPayPlanPaymentMethodStatus.Active
                    ? HpsPayPlanPaymentMethodStatus.Inactive
                    : HpsPayPlanPaymentMethodStatus.Active;
                paymentMethod.paymentStatus = paymentStatus;

                // Make edit
                self.hpsPayPlanService.editPaymentMethod(paymentMethod, function (editErr, editResult) {
                    assert.equal(editErr, null, 'Should not return an error.');
                    assert.ok(editResult);
                    assert.equal(editResult.paymentMethodKey, paymentMethod.paymentMethodKey);

                    // Verify edit
                    self.hpsPayPlanService.getPaymentMethod(editResult, function (getErr, getResult) {
                        assert.equal(getErr, null, 'Should not return an error.');
                        assert.ok(getResult);
                        assert.equal(getResult.paymentStatus, paymentStatus);
                        done();
                    });
                });
            });
    },
    findAllPaymentMethods: function (done) {
        self.hpsPayPlanService.findAllPaymentMethods({paymentMethodIdentifier: 'SecureSubmit'},
            function (err, result) {
                assert.equal(err, null, 'Should not return an error.');
                assert.ok(result);
                assert.ok(result.results);
                assert.equal(result.results.length > 0, true);
                done();
            });
    },
    findAllPaymentMethodsWithPaging: function (done) {
        self.hpsPayPlanService.page(1, 0).findAllPaymentMethods(function (err, result) {
            assert.equal(err, null, 'Should not return an error.');
            assert.ok(result);
            assert.ok(result.results);
            assert.equal(result.results.length === 1, true);
            done();
        });
    },
    findAllPaymentMethodsWithFilters: function (done) {
        self.hpsPayPlanService.findAllPaymentMethods({paymentMethodIdentifier: 'SecureSubmit'},
            function (err, result) {
                assert.equal(err, null, 'Should not return an error.');
                assert.ok(result);
                assert.ok(result.results);
                assert.equal(result.results.length > 0, true);
                done();
            });
    },
    getPaymentMethodByPaymentMethod: function (done) {
        self.hpsPayPlanService.page(1, 0).findAllPaymentMethods(function (err, result) {
            assert.equal(err, null, 'Should not return an error.');
            assert.ok(result);
            assert.ok(result.results);
            assert.equal(result.results.length === 1, true);

            self.hpsPayPlanService.getPaymentMethod(result.results[0], function (getErr, getResult) {
                assert.equal(getErr, null, 'Should not return an error.');
                assert.ok(getResult);
                done();
            });
        });
    },
    getPaymentMethodByPaymentMethodKey: function (done) {
        self.hpsPayPlanService.page(1, 0).findAllPaymentMethods(function (err, result) {
            assert.equal(err, null, 'Should not return an error.');
            assert.ok(result);
            assert.ok(result.results);
            assert.equal(result.results.length === 1, true);

            self.hpsPayPlanService.getPaymentMethod(result.results[0].paymentMethodKey,
                function (getErr, getResult) {
                    assert.equal(getErr, null, 'Should not return an error.');
                    assert.ok(getResult);
                    done();
                });
        });
    },
    deletePaymentMethodByPaymentMethod: function (done) {
        exports.payplan_payment_methods_valid_config.addPaymentMethod(function () {
            self.hpsPayPlanService.page(1, 0).findAllPaymentMethods({hasSchedules: false}, function (err, result) {
                assert.equal(err, null, 'Should not return an error.');
                assert.ok(result);
                assert.ok(result.results);
                assert.equal(result.results.length === 1, true);

                self.hpsPayPlanService.deletePaymentMethod(result.results[0], function (deleteErr, deleteResult) {
                    assert.equal(deleteErr, null, 'Should not return an error.');
                    assert.ok(deleteResult);
                    done();
                });
            });
        });
    },
    deletePaymentMethodByPaymentMethodKey: function (done) {
        exports.payplan_payment_methods_valid_config.addPaymentMethod(function () {
            self.hpsPayPlanService.page(1, 0).findAllPaymentMethods({hasSchedules: false}, function (err, result) {
                assert.equal(err, null, 'Should not return an error.');
                assert.ok(result);
                assert.ok(result.results);
                assert.equal(result.results.length === 1, true);

                self.hpsPayPlanService.deletePaymentMethod(result.results[0].paymentMethodKey,
                    function (deleteErr, deleteResult) {
                        assert.equal(deleteErr, null, 'Should not return an error.');
                        assert.ok(deleteResult);
                        done();
                    });
            });
        });
    },
    deletePaymentMethodWithActiveSchedule: function (done) {
        self.hpsPayPlanService.page(1, 0).findAllPaymentMethods(
            {hasSchedules: true, hasActiveSchedules: true},
            function (err, result) {
                assert.equal(err, null, 'Should not return an error.');
                assert.ok(result);
                assert.ok(result.results);
                assert.equal(result.results.length === 1, true);

                self.hpsPayPlanService.deletePaymentMethod(result.results[0], function (deleteErr, deleteResult) {
                        assert.equal(deleteResult, null, 'Should not return a result.');
                        assert.ok(deleteErr);
                        done();
                    });
            }
        );
    }
};
