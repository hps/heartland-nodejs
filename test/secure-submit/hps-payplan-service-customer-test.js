'use strict';

var fs                       = require('fs'),
    config                   = require('nconf'),
    assert                   = require('assert'),
    util                     = require('util'),
    _                        = require('lodash'),
    HpsPayPlanService        = require('../../lib/services/secure-submit/hps-payplan-service'),
    HpsPayPlanCustomerStatus = require('../../lib/infrastructure/enums').PayPlan.HpsPayPlanCustomerStatus;

if (fs.statSync('./test/config.json')) {
    config.file({file: './test/config.json'});
}

function getIdentifier(id) {
    var date = new Date()
        .toISOString()
        .split('T', 1)[0]
        .replace(/\-/g, '');
    var base = '%s-%s-' + _.shuffle('abcdefghijklmnopqrstuvwxyz').slice(0, 10).join('');
    return util.format(base, date, id);
}

function makeCustomerObject() {
    return {
        customerIdentifier: getIdentifier('SecureSubmit'),
        firstName: 'Bill',
        lastName: 'Johnson',
        company: 'Heartland Payment Systems',
        country: 'USA',
        customerStatus: HpsPayPlanCustomerStatus.Active
    };
}

var self;
exports.payplan_customers_valid_config = {
    setUp: function (done) {
        this.hpsPayPlanService = new HpsPayPlanService(config.get('validPayPlanConfig'), false);
        self = this;
        done();
    },
    addCustomer: function (done) {
        self.hpsPayPlanService.addCustomer(makeCustomerObject(), function (err, result) {
            assert.equal(err, null, 'Should not return an error.');
            assert.ok(result, 'The result should be something.');
            assert.ok(result.customerKey);
            done();
        });
    },
    addCustomerNull: function (done) {
        self.hpsPayPlanService.addCustomer(null, function (err, result) {
            assert.ok(err, 'There should be something for `err`.');
            assert.equal(result, null, 'The result should be null.');
            done();
        });
    },
    editCustomer: function (done) {
        // Get customer
        self.hpsPayPlanService.findAllCustomers({customerIdentifier: 'SecureSubmit'},
            function (err, result) {
                assert.equal(err, null, 'Should not return an error.');
                assert.ok(result);
                assert.ok(result.results);
                assert.notEqual(result.results.length, 0);

                var phoneDay = '555' + _.shuffle('1234567890').slice(0, 7).join('');
                var customer = result.results[0];
                customer.phoneDay = phoneDay;

                // Make edit
                self.hpsPayPlanService.editCustomer(customer, function (editErr, editResult) {
                    assert.equal(editErr, null, 'Should not return an error.');
                    assert.ok(editResult);
                    assert.equal(editResult.customerKey, customer.customerKey);

                    // Verify edit
                    self.hpsPayPlanService.getCustomer(editResult, function (getErr, getResult) {
                        assert.equal(getErr, null, 'Should not return an error.');
                        assert.ok(getResult);
                        assert.equal(getResult.phoneDay, phoneDay);
                        done();
                    });
                });
            });
    },
    findAllCustomers: function (done) {
        self.hpsPayPlanService.findAllCustomers({customerIdentifier: 'SecureSubmit'},
            function (err, result) {
                assert.equal(err, null, 'Should not return an error.');
                assert.ok(result);
                assert.ok(result.results);
                assert.equal(result.results.length > 0, true);
                done();
            });
    },
    findAllCustomersWithPaging: function (done) {
        self.hpsPayPlanService.page(1, 0).findAllCustomers(function (err, result) {
            assert.equal(err, null, 'Should not return an error.');
            assert.ok(result);
            assert.ok(result.results);
            assert.equal(result.results.length === 1, true);
            done();
        });
    },
    findAllCustomersWithFilters: function (done) {
        self.hpsPayPlanService.findAllCustomers({customerIdentifier: 'SecureSubmit'},
            function (err, result) {
                assert.equal(err, null, 'Should not return an error.');
                assert.ok(result);
                assert.ok(result.results);
                assert.equal(result.results.length > 0, true);
                done();
            });
    },
    getCustomerByCustomer: function (done) {
        self.hpsPayPlanService.page(1, 0).findAllCustomers(function (err, result) {
            assert.equal(err, null, 'Should not return an error.');
            assert.ok(result);
            assert.ok(result.results);
            assert.equal(result.results.length === 1, true);

            self.hpsPayPlanService.getCustomer(result.results[0], function (getErr, getResult) {
                assert.equal(getErr, null, 'Should not return an error.');
                assert.ok(getResult);
                done();
            });
        });
    },
    getCustomerByCustomerKey: function (done) {
        self.hpsPayPlanService.page(1, 0).findAllCustomers(function (err, result) {
            assert.equal(err, null, 'Should not return an error.');
            assert.ok(result);
            assert.ok(result.results);
            assert.equal(result.results.length === 1, true);

            self.hpsPayPlanService.getCustomer(result.results[0].customerKey,
                function (getErr, getResult) {
                    assert.equal(getErr, null, 'Should not return an error.');
                    assert.ok(getResult);
                    done();
                });
        });
    },
    deleteCustomerByCustomer: function (done) {
        self.hpsPayPlanService.page(1, 0).findAllCustomers(function (err, result) {
            assert.equal(err, null, 'Should not return an error.');
            assert.ok(result);
            assert.ok(result.results);
            assert.equal(result.results.length === 1, true);

            self.hpsPayPlanService.deleteCustomer(result.results[0], function (deleteErr, deleteResult) {
                assert.equal(deleteErr, null, 'Should not return an error.');
                assert.ok(deleteResult);
                done();
            });
        });
    },
    deleteCustomerByCustomerKey: function (done) {
        exports.payplan_customers_valid_config.addCustomer(function () {
            self.hpsPayPlanService.page(1, 0).findAllCustomers(
                {hasSchedules: false},
                function (err, result) {
                    assert.equal(err, null, 'Should not return an error.');
                    assert.ok(result);
                    assert.ok(result.results);
                    assert.equal(result.results.length === 1, true);

                    self.hpsPayPlanService.deleteCustomer(result.results[0].customerKey,
                        function (deleteErr, deleteResult) {
                            assert.equal(deleteErr, null, 'Should not return an error.');
                            assert.ok(deleteResult);
                            done();
                        });
                }
            );
        });
    }
};
