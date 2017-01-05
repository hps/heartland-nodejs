'use strict';

var fs                       = require('fs'),
    config                   = require('nconf'),
    assert                   = require('assert'),
    util                     = require('util'),
    _                        = require('lodash'),
    https                    = require('https'),
    HpsPayPlanService        = require('../../lib/services/secure-submit/hps-payplan-service'),
    HpsPayPlanPaymentMethodStatus = require('../../lib/infrastructure/enums').PayPlan.HpsPayPlanPaymentMethodStatus,
    HpsPayPlanScheduleDuration = require('../../lib/infrastructure/enums').PayPlan.HpsPayPlanScheduleDuration,
    HpsPayPlanScheduleFrequency = require('../../lib/infrastructure/enums').PayPlan.HpsPayPlanScheduleFrequency,
    HpsPayPlanScheduleStatus = require('../../lib/infrastructure/enums').PayPlan.HpsPayPlanScheduleStatus;

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

function makeScheduleObject(paymentMethod) {
    var id = getIdentifier('SecureSubmit');
    var date = new Date();
    date.setUTCMonth(date.getUTCMonth() + 2);
    var month = date.getUTCMonth().toString();
    date = "00".substring(0, 2 - month.length) + month + '30' + date.getUTCFullYear().toString();
    return {
        scheduleIdentifier: id,
        customerKey: paymentMethod.customerKey,
        paymentMethodKey: paymentMethod.paymentMethodKey,
        subtotalAmount: {value: 100},
        startDate: date,
        frequency: HpsPayPlanScheduleFrequency.Weekly,
        duration: HpsPayPlanScheduleDuration.LimitedNumber,
        numberOfPayments: 3,
        reprocessingCount: 2,
        emailReceipt: 'Never',
        emailAdvanceNotice: 'No',
        scheduleStatus: HpsPayPlanScheduleStatus.Active
    };
}

var self;
exports.payplan_schedules_valid_config = {
    setUp: function (done) {
        self = this;
        this.hpsPayPlanService = new HpsPayPlanService(config.get('validPayPlanConfig'), false);
        this.hpsPayPlanService.page(1, 0).findAllPaymentMethods(
            {customerIdentifier: 'SecureSubmit', paymentStatus: HpsPayPlanPaymentMethodStatus.Active},
            function (err, result) {
                assert.equal(err, null);
                assert.ok(result);
                assert.ok(result.results);
                assert.notEqual(result.results.length, 0);
                self.paymentMethod = result.results[0];
                done();
            }
        );
    },
    addSchedule: function (done) {
        var schedule = makeScheduleObject(self.paymentMethod);
        self.hpsPayPlanService.addSchedule(schedule, function (err, result) {
            assert.equal(err, null, 'Should not return an error.');
            assert.ok(result, 'The result should be something.');
            assert.ok(result.scheduleKey);
            done();
        });
    },
    addScheduleNull: function (done) {
        self.hpsPayPlanService.addSchedule(null, function (err, result) {
            assert.ok(err, 'There should be something for `err`.');
            assert.equal(result, null, 'The result should be null.');
            done();
        });
    },
    editSchedule: function (done) {
        // Get customer
        self.hpsPayPlanService.findAllSchedules({customerIdentifier: 'SecureSubmit'},
            function (err, result) {
                assert.equal(err, null, 'Should not return an error.');
                assert.ok(result);
                assert.ok(result.results);
                assert.notEqual(result.results.length, 0);

                var schedule = result.results[0];
                var scheduleStatus = schedule.scheduleStatus === HpsPayPlanScheduleStatus.Active
                    ? HpsPayPlanScheduleStatus.Inactive
                    : HpsPayPlanScheduleStatus.Active;
                schedule.scheduleStatus = scheduleStatus;

                // Make edit
                self.hpsPayPlanService.editSchedule(schedule, function (editErr, editResult) {
                    assert.equal(editErr, null, 'Should not return an error.');
                    assert.ok(editResult);
                    assert.equal(editResult.scheduleKey, schedule.scheduleKey);

                    // Verify edit
                    self.hpsPayPlanService.getSchedule(editResult, function (getErr, getResult) {
                        assert.equal(getErr, null, 'Should not return an error.');
                        assert.ok(getResult);
                        assert.equal(getResult.scheduleStatus, scheduleStatus);
                        done();
                    });
                });
            });
    },
    findAllSchedules: function (done) {
        self.hpsPayPlanService.findAllSchedules(function (err, result) {
            assert.equal(err, null, 'Should not return an error.');
            assert.ok(result);
            assert.ok(result.results);
            assert.equal(result.results.length > 0, true);
            done();
        });
    },
    findAllSchedulesWithPaging: function (done) {
        self.hpsPayPlanService.page(1, 0).findAllSchedules(function (err, result) {
            assert.equal(err, null, 'Should not return an error.');
            assert.ok(result);
            assert.ok(result.results);
            assert.equal(result.results.length === 1, true);
            done();
        });
    },
    findAllSchedulesWithFilters: function (done) {
        self.hpsPayPlanService.findAllSchedules({scheduleIdentifier: 'SecureSubmit'},
            function (err, result) {
                assert.equal(err, null, 'Should not return an error.');
                assert.ok(result);
                assert.ok(result.results);
                assert.equal(result.results.length > 0, true);
                done();
            });
    },
    getScheduleBySchedule: function (done) {
        self.hpsPayPlanService.page(1, 0).findAllSchedules(function (err, result) {
            assert.equal(err, null, 'Should not return an error.');
            assert.ok(result);
            assert.ok(result.results);
            assert.equal(result.results.length === 1, true);

            self.hpsPayPlanService.getSchedule(result.results[0], function (getErr, getResult) {
                assert.equal(getErr, null, 'Should not return an error.');
                assert.ok(getResult);
                done();
            });
        });
    },
    getScheduleByScheduleKey: function (done) {
        self.hpsPayPlanService.page(1, 0).findAllSchedules(function (err, result) {
            assert.equal(err, null, 'Should not return an error.');
            assert.ok(result);
            assert.ok(result.results);
            assert.equal(result.results.length === 1, true);

            self.hpsPayPlanService.getSchedule(result.results[0].scheduleKey,
                function (getErr, getResult) {
                    assert.equal(getErr, null, 'Should not return an error.');
                    assert.ok(getResult);
                    done();
                });
        });
    },
    deleteScheduleBySchedule: function (done) {
        exports.payplan_schedules_valid_config.addSchedule(function () {
            self.hpsPayPlanService.page(1, 0).findAllSchedules({hasSchedules: false}, function (err, result) {
                assert.equal(err, null, 'Should not return an error.');
                assert.ok(result);
                assert.ok(result.results);
                assert.equal(result.results.length === 1, true);

                self.hpsPayPlanService.deleteSchedule(result.results[0], function (deleteErr, deleteResult) {
                    assert.equal(deleteErr, null, 'Should not return an error.');
                    assert.ok(deleteResult);
                    done();
                });
            });
        });
    },
    deleteScheduleByScheduleKey: function (done) {
        exports.payplan_schedules_valid_config.addSchedule(function () {
            self.hpsPayPlanService.page(1, 0).findAllSchedules(function (err, result) {
                assert.equal(err, null, 'Should not return an error.');
                assert.ok(result);
                assert.ok(result.results);
                assert.equal(result.results.length === 1, true);

                self.hpsPayPlanService.deleteSchedule(result.results[0].scheduleKey,
                    function (deleteErr, deleteResult) {
                        assert.equal(deleteErr, null, 'Should not return an error.');
                        assert.ok(deleteResult);
                        done();
                    });
            });
        });
    }
};
