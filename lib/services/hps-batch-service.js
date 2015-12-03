'use strict';

var HpsService = require('./hps-service').HpsService,
    Gateway = require('../infrastructure/gateway'),
    helpers = require('../infrastructure/helpers'),
    exceptionMapper = require('../infrastructure/exception-mapper'),
    hpsService,gateway,
    HpsBatchService = function (hpsServicesConfig, soapUri) {
        hpsService = new HpsService(hpsServicesConfig, soapUri);
        gateway = new Gateway(hpsService, helpers, exceptionMapper);
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
    gateway.batchClose(transaction, callback);
    return this;
};

exports.HpsBatchService = HpsBatchService;