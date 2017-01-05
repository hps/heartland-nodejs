'use strict';

var fs            = require('fs'),
    config        = require('nconf'),
    assert        = require('assert'),
    PorticoReport = require('../../lib/services/portico-services/report-service');

if (fs.statSync('./test/config.json')) {

    config.file({file: './test/config.json'});

    exports.report_valid_config = {
        setUp: function (done) {
            this.service = new PorticoReport(config.get('validServicesConfig'), config.get('testUri'));
            done();
        },
        reportBatchHistory: function (done) {
            var startDate = new Date(),
                endDate   = new Date();

            startDate.setDate(startDate.getDate() - 3);
            endDate.setDate(endDate.getDate() - 2);

            this.service.reportBatchHistory(startDate.toISOString(), endDate.toISOString(), null, null, function (err, result) {
                assert.notEqual(result, undefined, 'The result should be something.');
                assert.equal(err, null, 'Should not return an error.');
                done();
            });
        }
    };
}
