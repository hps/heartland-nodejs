'use strict';

function Gateway(hpsService, helpers, exceptionMapper) {
    var self = this;

    self.creditSale =
        function creditSale(transaction, amount, currency, callback) {
            hpsService.submitTransaction(transaction, function (err, result) {
                if (err) {
                    callback(err, null);
                } else {
                    var h = result.header, b = result.body.CreditSale;
                    processAuth(h, b, amount, currency, callback);
                }
            });
        };

    self.creditAuth = 
        function creditAuth(transaction, amount, currency, callback) {
            hpsService.submitTransaction(transaction, function (err, result) {
                if (err) {
                    callback(err, null);
                } else {
                    var h = result.header, b = result.body.CreditAuth;
                    processAuth(h, b, amount, currency, callback);
                }
            });
        };

    self.creditAccountVerify = 
        function creditAccountVerify(transaction, callback) {
            hpsService.submitTransaction(transaction, function (err, result) {
                if (err) {
                    callback(err, null);
                } else {
                    var h = result.header, b = result.body.CreditAccountVerify;
                    callback(null, helpers.hydrateAuthResult(h, b));
                }
            });
        };

    self.creditAddToBatch = 
        function creditAddToBatch(transaction, callback) {
            hpsService.submitTransaction(transaction, function (err, captureResult) {
                if (err) {
                    callback(err, null);
                } else {
                    self.reportTxnDetail({ReportTxnDetail: {TxnId: transaction.CreditAddToBatch.GatewayTxnId}}, function (err, getResult) {
                        if (err) {
                            callback(null, captureResult);
                        } else {
                            callback(null, getResult);
                        }
                    });
                }
            });
        };

    self.creditReturn = 
        function creditReturn(transaction, callback) {
            hpsService.submitTransaction(transaction, function (err, result) {
                if (err) {
                    callback(err, null);
                } else {
                    callback(null, {
                        transactionId: result.header.GatewayTxnId
                    });
                }
            });
        };

    self.creditReversal = 
        function creditReversal(transaction, callback) {
            hpsService.submitTransaction(transaction, function (err, result) {
                if (err) {
                    callback(err, null);
                } else {
                    var b = result.body.CreditReversal;
                    callback(null, {
                        transactionId: result.header.GatewayTxnId,
                        AvsResultCode: b.AVSRsltCode,
                        AvsResultText: b.AVSRsltText,
                        CpcIndicator: b.CPCInd,
                        CvvResultCode: b.CVVRsltCode,
                        CvvResultText: b.CVVRsltText,
                        ReferenceNumber: b.RefNbr,
                        ResponseCode: b.RspCode,
                        ResponseText: b.RspText
                    });
                }
            });
        };

    self.batchClose = 
        function batchClose(transaction, callback) {
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

    self.reportTxnDetail = 
        function reportTxnDetail(transaction, callback) {
            hpsService.submitTransaction(transaction, function (err, result) {
                if (err) {
                    callback(err, null);
                } else {
                    var t = result.body.ReportTxnDetail;
                    result = {
                        transactionId: t.GatewayTxnId,
                        originalTransactionId: t.OriginalGatewayTxnId,
                        settlementAmount: t.SettlementAmt,
                        authorizedAmount: t.Data.AuthAmt,
                        authorizationCode: t.Data.AuthCode,
                        avsResultCode: t.Data.AVSRsltCode,
                        avsResultText: t.Data.AVSRsltText,
                        cardType: t.Data.CardType,
                        maskedCardNumber: t.Data.MaskedCardNbr,
                        transactionType: helpers.serviceNameToTransactionType(t.ServiceName),
                        transactionUtcDate: t.ReqUtcDT,
                        cpcIndicator: t.Data.CPCInd,
                        cvvResultCode: t.Data.CVVRsltCode,
                        cvvResultText: t.Data.CVVRsltText,
                        referenceNumber: t.Data.RefNbr,
                        responseCode: t.Data.RspCode,
                        responseText: t.Data.RspText,
                        tokenData: t.Data.TokenizationMsg ? null : {
                            tokenRspMsg: t.Data.TokenizationMsg
                        },
                        exceptions: (t.GatewayRspCode !== 0 || t.Data.RspCode !== '00') ? {
                            hpsException: t.GatewayRspCode !== 0 ?
                                    exceptionMapper.mapGatewayException(t.GatewayTxnId, t.GatewayRspCode, t.GatewayRspMsg) : null,
                            cardException: t.Data.RspCode !== '00' ?
                                    exceptionMapper.mapIssuerException(t.GatewayTxnId, t.Data.RspCode, t.Data.RspText) : null
                        } : undefined
                    };

                    callback(null, result);
                }
            });
        };

    self.reportActivity = 
        function reportActivity(transaction, filterBy, callback) {
            hpsService.submitTransaction(transaction, function (err, result) {
                if (err) {
                    callback(err, null);
                } else {
                    var transactionList = [], t, i, h = result.header, b = result.body,
                    serviceName = filterBy ? helpers.transactionTypeToServiceName(filterBy) : '';

                    for (i = 0; i < b.ReportActivity.Details.length; i++) {
                        t = b.ReportActivity.Details[i];
                        if (!filterBy || t.ServiceName === serviceName) {
                            transactionList.push({
                                transactionId: t.GatewayTxnId,
                                originalTransactionId: t.OriginalGatewayTxnId,
                                maskedCardNumber: t.MaskedCardNbr,
                                responseCode: t.IssuerRspCode,
                                responseText: t.IssuerRspText,
                                amount: t.Amt,
                                settlementAmount: t.SettlementAmt,
                                transactionUtcDate: t.TxnUtcDT,
                                transactionType: filterBy || helpers.serviceNameToTransactionType(t.ServiceName),
                                exceptions: (t.GatewayRspCode !== '0' || t.IssuerRspCode !== '00') ? {
                                    hpsException: t.GatewayRspCode !== '0' ?
                                            exceptionMapper.mapGatewayException(t.GatewayTxnId, t.GatewayRspCode, t.GatewayRspMsg) : null,
                                    cardException: t.IssuerRspCode !== '00' ?
                                            exceptionMapper.mapIssuerException(t.GatewayTxnId, t.IssuerRspCode, t.IssuerRspText) : null
                                } : null
                            });
                        }
                    }

                    callback(null, transactionList);
                }
            });
        }

    // Supplemental functions - Do not correlate to SOAP endpoints...

    self.reverse = 
        function reverse(amount, currency, transactionId, memo, callback) {
            try { helpers.checkAmount(amount); } catch (amountError) { callback(amountError, null); return this; }
            try { helpers.checkCurrency(currency); } catch (currencyError) { callback(currencyError, null); return this; }
            try { helpers.checkTransactionId(transactionId); } catch (transactionError) { callback(transactionError, null); return this; }

            var transaction = {
                CreditReversal: {
                    Block1: {
                        GatewayTxnId: transactionId,
                        Amt: amount,
                        AdditionalTxnFields: {Description: memo}
                    }
                }
            };

            self.creditReversal(transaction, callback);
            return this;
        };

    function processAuth(h, b, amount, currency, callback) {
        checkForAuthGatewayError(h.GatewayRspCode, h.GatewayRspMsg, h.GatewayTxnId, amount, currency, function (err) {
            if (err) {
                callback(err, null);
            } else {
                checkForAuthIssuerError(b.RspCode, b.RspText, h.GatewayTxnId, amount, currency, function (err) {
                    if (err) {
                        callback(err, null);
                    } else {
                        callback(null, helpers.hydrateAuthResult(h, b));
                    }
                });
            }
        });
    };

    function checkForAuthGatewayError(responseCode, responseText, transactionId, amount, currency, callback) {
        if (responseCode !== 0) {
            /* If we get a timeout from the gateway, perform a credit reversal to back out any pending charges. */
            if (responseCode === 30) {
                reverse(amount, currency, transactionId, function (err) {
                    if (err) {
                        callback(exceptionMapper.mapSdkException('reversal_error_after_gateway_timeout', err));
                    } else {
                        callback(exceptionMapper.mapGatewayException(transactionId, responseCode, responseText));
                    }
                });
            } else {
                callback(exceptionMapper.mapGatewayException(transactionId, responseCode, responseText));
            }
        } else {
            callback(null);
        }
    };

    function checkForAuthIssuerError(responseCode, responseText, transactionId, amount, currency, callback) {
        if (responseCode !== '00') {
            /* If we get a timeout from the issuer, perform a credit reversal to back out any pending charges. */
            if (responseCode === '91') {
                reverse(amount, currency, transactionId, null, function (err) {
                    if (err) {
                        callback(exceptionMapper.mapSdkException('reversal_error_after_issuer_timeout', err));
                    } else {
                        callback(exceptionMapper.mapIssuerException(transactionId, responseCode, responseText));
                    }
                });
            } else {
                callback(exceptionMapper.mapIssuerException(transactionId, responseCode, responseText));
            }
        } else {
            callback(null);
        }
    };
};

module.exports = Gateway;