'use strict';

var PorticoGateway = require('../portico-gateway');

function HpsBatchService(hpsConfig, soapUri) {
    var self = this,
        gateway = new PorticoGateway(hpsConfig, soapUri);
        
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
    var closeBatch = 
        function closeBatch(callback) {
            
            gateway.submitTransaction({'BatchClose':{}}, function (err, result) {
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

            return self;
        };

    return {
        closeBatch: closeBatch
    };
};


module.exports = HpsBatchService;