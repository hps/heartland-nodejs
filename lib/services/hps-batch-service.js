'use strict';

var HpsService = require('./hps-service').HpsService,
    hpsService,
    HpsBatchService = function (hpsServicesConfig, soapUri) {
        hpsService = new HpsService(hpsServicesConfig, soapUri);
    },
    submitBatchClose = function (transaction, callback) {
        hpsService.submitTransaction(transaction, function (err, result) {
            if (err) {
                callback(err, null);
            } else {
                var b = result.body.BatchClose;
                result = {
                    Id: b.BatchId,
                    sequenceNumber: b.BatchSeqNbr,
                    totalAmount: b.TotalAmt,
                    transactionCount: b.TxnCnt
                };

                callback(null, result);
            }
        });
    };

/**
 * A *Batch Close* transaction instructs the Heartland POS Gateway to close the current
 * open batch and settle it. If a batch is not open, an error will be returned.
 *
 * * Example:
 *
 *     myHpsBatchService.closeBatch(function (err, result) {
 *         // Do something with the result...
 *     });
 *
 * @param {Function} callback
 * @return {Object} exports for chaining
 */
HpsBatchService.prototype.closeBatch = function (callback) {
    var transaction = {BatchClose: {}};
    submitBatchClose(transaction, callback);
    return this;
};

exports.HpsBatchService = HpsBatchService;