'use strict';

var HpsService = require('./hps-service').HpsService,
    Gateway = require('../infrastructure/gateway'),
    helpers = require('../infrastructure/helpers'),
    exceptionMapper = require('../infrastructure/exception-mapper'),
    hpsService,gateway,
    HpsReportService = function (hpsServicesConfig, soapUri) {
        hpsService = new HpsService(hpsServicesConfig, soapUri);
        gateway = new Gateway(hpsService, helpers, exceptionMapper);
    };

/**
 * Gets an HPS transaction given a `transactionId`. Use the `callback` to process the result.
 *
 * * Example:
 *
 *     myHpsReportService.get(12345, function (err, result) {
 *         // Do something with the result...
 *     });
 *
 * @param {Number} transactionId
 * @param {Function} callback
 * @return {Object} exports for chaining
 */
HpsReportService.prototype.get = function (transactionId, callback) {
    try { helpers.checkTransactionId(transactionId); } catch (transactionError) { callback(transactionError, null); return this; }

    var transaction = {ReportTxnDetail: {TxnId: transactionId}};
    gateway.reportTxnDetail(transaction, callback);
    return this;
};

/**
 * Gets an array of transaction summaries between UTC `startDate` and `endDate`. Use `filterBy`
 * to filter results to a particular transaction type (e.g. 'charge' or 'capture').
 *
 * * Examples:
 *
 *     var startDate = new Date(), endDate = new Date();
 *     startDate.setDate(startDate.getDate() - 1);
 *     hpsCreditService.list(startDate.toISOString(), endDate.toISOString(), null, function (err, result) {
 *          // Do something with the results...
 *     }
 *
 * @param {String} startDate
 * @param {String} endDate
 * @param {String} filterBy
 * @param {Function} callback
 * @return {Object} exports for chaining
 */
HpsReportService.prototype.list = function (startDate, endDate, filterBy, callback) {
    var now = new Date(), transaction;

    if (startDate > now) {
        callback(exceptionMapper.mapSdkException('invalid_start_date', null), null);
    } else if (endDate > now) {
        callback(exceptionMapper.mapSdkException('invalid_end_date', null), null);
    }

    transaction = {
        ReportActivity: {
            RptStartUtcDT: startDate,
            RptEndUtcDT: endDate
        }
    };

    gateway.reportActivity(transaction, filterBy, callback);
    return this;
};

exports.HpsReportService = HpsReportService;
