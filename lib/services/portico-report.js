/**
 *  Overview of Portico Report Transactions:
 *
 *  ReportActivity **Deprecated** 
 *      Returns all activity between the client devices and gateway for a period of time. This can be filtered to a single device if needed.
 *      Note: This has been obsoleted and should no longer be used. See FindTransactions for an alternative.
 *
 *  ReportBatchDetail
 *      Returns information on each transaction currently associated to the specified batch. This report is for the site and device referenced in the header.
 *      
 *  ReportBatchHistory
 *      Returns information about previous batches over a period of time. This report is for the site referenced in the header.
 *      
 *  ReportBatchSummary
 *      Returns a batch's status information and totals broken down by payment type. This report is for the site and device referenced in the header.
 *      
 *  ReportOpenAuths
 *      Returns all authorizations that have not been added to a batch for settlement. This report is for the site referenced in the header.
 *      
 *  ReportSearch **Deprecated**
 *      ReportSearch returns transaction information for a specified time period.
 *      Note: This has been obsoleted and should no longer be used. See FindTransactions for an alternative.
 *
 *  ReportTxnDetail 
 *      Returns detailed information about a single transaction. This report is for the site and device referenced in the header.
 *
 */

'use strict';

var tv4             = require('tv4'),
	hlp 			= require('../infra/helpers'),
	porticoSchema   = require('../infra/portico-schema'),
	PorticoGateway  = require('../infra/portico-gateway');

function PorticoReport(hpsConfig, soapUri) {
	var self = this,
		gateway = new PorticoGateway(hpsConfig, soapUri);

	/**
	 * Gets details of a particular batch referenced by batchId. The enum `tzConversion` determines
	 * the time zone of the returned datetime values.
	 *
	 * * Examples:
	 *
	 *     porticoReportService.reportBatchDetail(124567, null, function (err, result) {
	 *          // Do something with the results...
	 *     }
	 *
	 * @param {Int} 		batchId 		If this is not provided, results will be returned for the current open batch.
	 * @param {String} 		tzConversion 	enum: 'Merchant';'UTC';'Datacenter'
	 * @param {Function} 	callback
	 * @return {Object} 					exports for chaining
	 */
	var reportBatchDetail = 
		function reportBatchDetail(batchId, tzConversion, callback) {
			var schema = porticoSchema.requestType('ReportBatchDetail'),
				tx = {};
			
			if (hlp.defNn(batchId)) 		tx.BatchId = batchId;
			if (hlp.defNn(tzConversion)) 	tx.TzConversion = tzConversion;

			if (tv4.validate(tx, schema)) {
				gateway.submitTransaction({ReportBatchDetail: tx}, callback);
			} else {
				callback(tv4.error, null);
			}

			return self;
		};

	/**
	 * Gets information about previous batches over a period of time. This report is for the site referenced in the header.
	 * Returns an array of batch summaries between UTC `startDate` and `endDate`. Use `deviceId`
	 * to filter results to a particular device for the given site. The enum `tzConversion` determines
	 * the time zone of the returned datetime values.
	 *
	 * * Examples:
	 *
	 *     var startDate = new Date(), endDate = new Date();
	 *     startDate.setDate(startDate.getDate() - 1);
	 *     porticoReportService.reportBatchHistory(startDate.toISOString(), endDate.toISOString(), null, null, function (err, result) {
	 *          // Do something with the results...
	 *     }
	 *
	 * @param {String} 		startDate		ISO Date String @ UTC
	 * @param {String} 		endDate 		ISO Date String @ UTC
	 * @param {Int} 		deviceId 		
	 * @param {String} 		tzConversion 	enum: 'Merchant';'UTC';'Datacenter'
	 * @param {Function} 	callback
	 * @return {Object} 					exports for chaining
	 */
	var reportBatchHistory = 
		function reportBatchHistory(startDate, endDate, deviceId, tzConversion, callback) {
			var schema = porticoSchema.requestType('ReportBatchHistory'),
				tx = {};

			if (hlp.defNn(startDate))      tx.RptStartUtcDT = startDate;
			if (hlp.defNn(endDate))        tx.RptEndUtcDT   = endDate;
			if (hlp.defNn(tzConversion))   tx.TzConversion  = tzConversion;
			if (hlp.defNn(deviceId))       tx.DeviceId      = deviceId;

			if (tv4.validate(tx, schema)) {
				gateway.submitTransaction({ReportBatchHistory: tx}, callback);
			} else {
				callback(tv4.error, null);
			}

			return self;
		};

	/**
	 * ReportBatchSummary returns a batch's status information and totals broken down by payment type.
	 * This report is for the site referenced in the header.
	 *
	 * * Example:
	 *
	 *     var startDate = new Date(), endDate = new Date();
	 *     startDate.setDate(startDate.getDate() - 1);
	 *     porticoReportService.reportBatchSummary(12345, startDate.toISOString(), endDate.toISOString(), 9184983, 1803, function (err, result) {
	 *         // Do something with the result...
	 *     });
	 *
	 * @param {Int} 	batchId 		
	 * @param {String} 	startDate 		ISO Date String @ UTC filters results...
	 * @param {String} 	endDate 		ISO Date String @ UTC filters results...
	 * @param {Int} 	batchSeqNum		
	 * @param {Int} 	clerkId 		filters results...
	 * @param {String} 	callback		
	 * @return {Object}					exports for chaining
	 */
	var reportBatchSummary = 
		function reportBatchSummary(batchId, startDate, endDate, batchSeqNum, clerkId, callback) {
			var schema = porticoSchema.requestType('ReportBatchSummary'),
				tx = {};

			if (hlp.defNn(startDate)) 		tx.RptStartUtcDT = startDate;
			if (hlp.defNn(endDate)) 		tx.RptEndUtcDT   = endDate;
			if (hlp.defNn(batchId)) 		tx.BatchId 		 = batchId;
			if (hlp.defNn(batchSeqNum)) 	tx.BatchSeqNbr   = batchSeqNum;
			if (hlp.defNn(clerkId)) 		tx.ClerkId 		 = clerkId;

			if (tv4.validate(tx, schema)) {
				gateway.submitTransaction({ReportBatchSummary: tx}, callback);
			} else {
				callback(tv4.error, null);
			}

			return self;
		};

	/**
	 * ReportOpenAuths returns all authorizations that have not been added to a batch for settlement.
	 * This report is for the site referenced in the header.
	 *
	 * * Example:
	 *
	 *     porticoReportService.reportOpenAuths(12345, 'UTC', function (err, result) {
	 *         // Do something with the result...
	 *     });
	 *
	 * @param {Int} deviceId
	 * @param {String} tzConversion (enum: 'Merchant';'UTC';'Datacenter')
	 * @param {String} callback
	 * @return {Object} exports for chaining
	 */
	var reportOpenAuths = 
		function reportOpenAuths(deviceId, tzConversion, callback) {
			var schema = porticoSchema.requestType('ReportBatchSummary'),
				tx = {};

			if (hlp.defNn(deviceId))       tx.DeviceId      = deviceId;
			if (hlp.defNn(tzConversion))   tx.TzConversion  = tzConversion;

			if (tv4.validate(tx, schema)) {
				gateway.submitTransaction({ReportOpenAuths: tx}, callback);
			} else {
				callback(tv4.error, null);
			}

			return self;
		};

	/**
	 * Gets an HPS transaction given a `transactionId`. Use the `callback` to process the result.
	 *
	 * * Example:
	 *
	 *     porticoReportService.reportTxnDetail(12345, function (err, result) {
	 *         // Do something with the result...
	 *     });
	 *
	 * @param {Number} transactionId
	 * @param {Function} callback
	 * @return {Object} exports for chaining
	 */
	var reportTxnDetail = 
		function reportTxnDetail(transactionId, callback) {
			var schema = porticoSchema.requestType('ReportTxnDetail'),
				tx = {};

			if (hlp.defNn(transactionId)) tx.TxnId  = transactionId;

			schema.required = ['TxnId'];

			if (tv4.validate(tx, schema)) {
				gateway.submitTransaction({ReportTxnDetail: tx}, callback);
			} else {
				callback(tv4.error, null);
			}

			return self;
		};


	return {
		reportBatchDetail: reportBatchDetail,
		reportBatchHistory: reportBatchHistory,
		reportBatchSummary: reportBatchSummary,
		reportOpenAuths: reportOpenAuths,
		reportTxnDetail: reportTxnDetail
	};

};


module.exports = PorticoReport;