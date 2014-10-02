'use strict';

var HpsService = require('./hps-service').HpsService,
    hpsService,
    HpsCreditService = function (hpsServicesConfig, soapUri) {
        hpsService = new HpsService(hpsServicesConfig, soapUri);
    },
    exceptionMapper = require('../infrastructure/exception-mapper'),
    checkAmount = function (amount) {
        if (amount === null || amount === undefined || amount < 0) {
            throw exceptionMapper.mapSdkException('invalid_amount', null);
        }
    },
    checkCurrency = function (currency) {
        if (!currency) {
            throw exceptionMapper.mapSdkException('missing_currency', null);
        } else if (currency.toLowerCase() !== 'usd') {
            throw exceptionMapper.mapSdkException('invalid_currency', null);
        }
    },
    checkTransactionId = function (transactionId) {
        if (transactionId === undefined || transactionId === null || transactionId <= 0) {
            throw exceptionMapper.mapSdkException('invalid_transaction_id', null);
        }
    },
    hydrateCardManualEntry = function (card) {
        return {
            CardNbr: card.number,
            ExpMonth: card.expMonth,
            ExpYear: card.expYear,
            CVV2: !card.cvv ? null : card.cvv.toString(),
            CardPresent: 'N',
            ReaderPresent: 'N'
        };
    },
    hydrateCardHolderData = function (cardHolder) {
        return cardHolder ? {
            CardHolderFirstName: cardHolder.firstName,
            CardHolderLastName: cardHolder.lastName,
            CardHolderEmail: cardHolder.email,
            CardHolderPhone: cardHolder.phone,
            CardHolderAddr: cardHolder.address.address,
            CardHolderCity: cardHolder.address.city,
            CardHolderState: cardHolder.address.state,
            CardHolderZip: cardHolder.address.zip
        } : undefined;
    },
    submitGet = function (transaction, callback) {
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
                    transactionType: hpsService.serviceNameToTransactionType(t.ServiceName),
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
    },
    submitReverse = function (transaction, callback) {
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
    },
    reverse = function (amount, currency, transactionId, memo, callback) {
        try { checkAmount(amount); } catch (amountError) { callback(amountError, null); return this; }
        try { checkCurrency(currency); } catch (currencyError) { callback(currencyError, null); return this; }
        try { checkTransactionId(transactionId); } catch (transactionError) { callback(transactionError, null); return this; }

        var transaction = {
            CreditReversal: {
                Block1: {
                    GatewayTxnId: transactionId,
                    Amt: amount,
                    AdditionalTxnFields: {Description: memo}
                }
            }
        };

        submitReverse(transaction, callback);
        return this;
    },
    checkForAuthGatewayError = function (responseCode, responseText, transactionId, amount, currency, callback) {
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
    },
    checkForAuthIssuerError = function (responseCode, responseText, transactionId, amount, currency, callback) {
        if (responseCode !== '00') {
            /* If we get a timeout from the issuer, perform a credit reversal to back out any pending charges. */
            if (responseCode === '91') {
                reverse(amount, currency, transactionId, function (err) {
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
    },
    hydrateAuthResult = function (h, b) {
        return {
            transactionId: h.GatewayTxnId,
            authorizationCode: b.AuthCode,
            avsResultCode: b.AVSRsltCode,
            avsResultText: b.AVSRsltText,
            cardType: b.CardType,
            cpcIndicator: b.CPCInd,
            cvvResultCode: b.CVVRsltCode,
            cvvResultText: b.CVVRsltText,
            referenceNumber: b.RefNbr,
            responseCode: b.RspCode,
            responseText: b.RspText,
            tokenData: h.TokenData ? {
                tokenRspCode: h.TokenData.TokenRspCode,
                tokenRspMsg: h.TokenData.TokenRspMsg,
                tokenValue: h.TokenData.TokenValue
            } : null
        };
    },
    processAuth = function (h, b, amount, currency, callback) {
        checkForAuthGatewayError(h.GatewayRspCode, h.GatewayRspMsg, h.GatewayTxnId, amount, currency, function (err) {
            if (err) {
                callback(err, null);
            } else {
                checkForAuthIssuerError(b.RspCode, b.RspText, h.GatewayTxnId, amount, currency, function (err) {
                    if (err) {
                        callback(err, null);
                    } else {
                        callback(null, hydrateAuthResult(h, b));
                    }
                });
            }
        });
    },
    submitCharge = function (transaction, amount, currency, callback) {
        hpsService.submitTransaction(transaction, function (err, result) {
            if (err) {
                callback(err, null);
            } else {
                var h = result.header, b = result.body.CreditSale;
                processAuth(h, b, amount, currency, callback);
            }
        });
    },
    submitAuthorization = function (transaction, amount, currency, callback) {
        hpsService.submitTransaction(transaction, function (err, result) {
            if (err) {
                callback(err, null);
            } else {
                var h = result.header, b = result.body.CreditAuth;
                processAuth(h, b, amount, currency, callback);
            }
        });
    },
    submitVerify = function (transaction, callback) {
        hpsService.submitTransaction(transaction, function (err, result) {
            if (err) {
                callback(err, null);
            } else {
                var h = result.header, b = result.body.CreditAccountVerify;
                callback(null, hydrateAuthResult(h, b));
            }
        });
    },
    submitCapture = function (transaction, callback) {
        hpsService.submitTransaction(transaction, function (err, captureResult) {
            if (err) {
                callback(err, null);
            } else {
                submitGet({ReportTxnDetail: {TxnId: transaction.CreditAddToBatch.GatewayTxnId}}, function (err, getResult) {
                    if (err) {
                        callback(null, captureResult);
                    } else {
                        callback(null, getResult);
                    }
                });
            }
        });
    },
    submitRefund = function (transaction, callback) {
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

/**
 * Gets an HPS transaction given a `transactionId`. Use the `callback` to process the result.
 *
 * * Example:
 *
 *     myHpsChargeService.get(12345, function (err, result) {
 *         // Do something with the result...
 *     });
 *
 * @param {Number} transactionId
 * @param {Function} callback
 * @return {Object} exports for chaining
 */
HpsCreditService.prototype.get = function (transactionId, callback) {
    try { checkTransactionId(transactionId); } catch (transactionError) { callback(transactionError, null); return this; }

    var transaction = {ReportTxnDetail: {TxnId: transactionId}};
    submitGet(transaction, callback);
    return this;
};

/**
 * Gets an array transaction summaries between UTC `startDate` and `endDate`. Use `filterBy`
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
HpsCreditService.prototype.list = function (startDate, endDate, filterBy, callback) {
    var now = new Date(), transaction, serviceName, transactionList = [], h, b, t, i;

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

    hpsService.submitTransaction(transaction, function (err, result) {
        if (err) {
            callback(err, null);
        } else {
            h = result.header;
            b = result.body;
            serviceName = filterBy ? hpsService.transactionTypeToServiceName(filterBy) : '';
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
                        transactionType: filterBy || hpsService.serviceNameToTransactionType(t.ServiceName),
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

    return this;
};

/**
 * The *credit sale* transaction authorizes a sale purchased with a credit card. The
 * authorization in place in the current open batch (should auto-close for e-commerce
 * transactions). If a batch is not open, this transaction will create an open batch.
 *
 * * Examples:
 *
 *     var card = {
 *              cvv: 123,
 *              expMonth: 12,
 *              expYear: 2015,
 *              number: "...valid number"
 *         },
 *         cardHolder = {
 *              address: {
 *                  address: "One Heartland Way",
 *                  city: "Jeffersonville",
 *                  state: "IN",
 *                  zip: "47130",
 *                  country: "United States"
 *              },
 *              firstName: "First",
 *              lastName: "Last"
 *         };
 *
 *     hpsCreditService.chargeWithCard(10.00, 'usd', card, cardHolder, false, null, function (err, result) {
 *          // Do something with the results...
 *     });
 *
 * @param {Number} amount
 * @param {String} currency
 * @param {Object} card
 * @param {Object} cardHolder
 * @param {Boolean} requestMultiUseToken
 * @param {String} memo
 * @param {Function} callback
 * @return {Object} exports for chaining
 */
HpsCreditService.prototype.chargeWithCard = function (amount, currency, card, cardHolder, requestMultiUseToken, memo, callback) {
    try { checkAmount(amount); } catch (amountError) { callback(amountError, null); return this; }
    try { checkCurrency(currency); } catch (currencyError) { callback(currencyError, null); return this; }

    var transaction = {
        CreditSale: {
            Block1: {
                CardData: {
                    ManualEntry: hydrateCardManualEntry(card),
                    TokenRequest: requestMultiUseToken ? 'Y' : 'N'
                },
                Amt: amount,
                CardHolderData: hydrateCardHolderData(cardHolder),
                AllowDup: 'Y',
                AdditionalTxnFields: {Description: memo}
            }
        }
    };

    submitCharge(transaction, amount, currency, callback);
    return this;
};

/**
 * The *credit sale* transaction authorizes a sale purchased with a credit card. The
 * authorization in place in the current open batch (should auto-close for e-commerce
 * transactions). If a batch is not open, this transaction will create an open batch.
 *
 * * Examples:
 *
 *     var cardHolder = {
 *              address: {
 *                  address: "One Heartland Way",
 *                  city: "Jeffersonville",
 *                  state: "IN",
 *                  zip: "47130",
 *                  country: "United States"
 *              },
 *              firstName: "First",
 *              lastName: "Last"
 *         },
 *         token = "aValidTokenValue";
 *
 *     hpsCreditService.chargeWithToken(10.00, 'usd', token, cardHolder, false, null, function (err, result) {
 *          // Do something with the results...
 *     });
 *
 * @param {Number} amount
 * @param {String} currency
 * @param {String} token
 * @param {Object} cardHolder
 * @param {Boolean} requestMultiUseToken
 * @param {String} memo
 * @param {Function} callback
 * @return {Object} exports for chaining
 */
HpsCreditService.prototype.chargeWithToken = function (amount, currency, token, cardHolder, requestMultiUseToken, memo, callback) {
    try { checkAmount(amount); } catch (amountError) { callback(amountError, null); return this; }
    try { checkCurrency(currency); } catch (currencyError) { callback(currencyError, null); return this; }

    var transaction = {
        CreditSale: {
            Block1: {
                CardData: {
                    TokenData: {TokenValue: token},
                    TokenRequest: requestMultiUseToken ? 'Y' : 'N'
                },
                Amt: amount,
                CardHolderData: hydrateCardHolderData(cardHolder),
                AllowDup: 'Y',
                AdditionalTxnFields: {Description: memo}
            }
        }
    };

    submitCharge(transaction, amount, currency, callback);
    return this;
};

/**
 * A *credit authorization* transaction authorizes a credit card transaction. The
 * authorization is NOT placed in the batch. The *credit authorization* transaction
 * can be committed by using the capture method.
 *
 * * Examples:
 *
 *     var card = {
 *              cvv: 123,
 *              expMonth: 12,
 *              expYear: 2015,
 *              number: "...valid number"
 *         },
 *         cardHolder = {
 *              address: {
 *                  address: "One Heartland Way",
 *                  city: "Jeffersonville",
 *                  state: "IN",
 *                  zip: "47130",
 *                  country: "United States"
 *              },
 *              firstName: "First",
 *              lastName: "Last"
 *         };
 *
 *     hpsCreditService.authorizeWithCard(10.00, 'usd', card, cardHolder, false, null, function (err, result) {
 *          // Do something with the results...
 *     });
 *
 * @param {Number} amount
 * @param {String} currency
 * @param {Object} card
 * @param {Object} cardHolder
 * @param {Boolean} requestMultiUseToken
 * @param {String} memo
 * @param {Function} callback
 * @return {Object} exports for chaining
 */
HpsCreditService.prototype.authorizeWithCard = function (amount, currency, card, cardHolder, requestMultiUseToken, memo, callback) {
    try { checkAmount(amount); } catch (amountError) { callback(amountError, null); return this; }
    try { checkCurrency(currency); } catch (currencyError) { callback(currencyError, null); return this; }

    var transaction = {
        CreditAuth: {
            Block1: {
                CardData: {
                    ManualEntry: hydrateCardManualEntry(card),
                    TokenRequest: requestMultiUseToken ? 'Y' : 'N'
                },
                Amt: amount,
                CardHolderData: hydrateCardHolderData(cardHolder),
                AllowDup: 'Y',
                AdditionalTxnFields: {Description: memo}
            }
        }
    };

    submitAuthorization(transaction, amount, currency, callback);
    return this;
};

/**
 * A *credit authorization* transaction authorizes a credit card transaction. The
 * authorization is NOT placed in the batch. The *credit authorization* transaction
 * can be committed by using the capture method.
 *
 * * Examples:
 *
 *     var cardHolder = {
 *              address: {
 *                  address: "One Heartland Way",
 *                  city: "Jeffersonville",
 *                  state: "IN",
 *                  zip: "47130",
 *                  country: "United States"
 *              },
 *              firstName: "First",
 *              lastName: "Last"
 *         },
 *         token = "aValidTokenValue";
 *
 *     hpsCreditService.authorizeWithToken(10.00, 'usd', token, cardHolder, false, null, function (err, result) {
 *          // Do something with the results...
 *     });
 *
 * @param {Number} amount
 * @param {String} currency
 * @param {String} token
 * @param {Object} cardHolder
 * @param {Boolean} requestMultiUseToken
 * @param {String} memo
 * @param {Function} callback
 * @return {Object} exports for chaining
 */
HpsCreditService.prototype.authorizeWithToken = function (amount, currency, token, cardHolder, requestMultiUseToken, memo, callback) {
    try { checkAmount(amount); } catch (amountError) { callback(amountError, null); return this; }
    try { checkCurrency(currency); } catch (currencyError) { callback(currencyError, null); return this; }

    var transaction = {
        CreditAuth: {
            Block1: {
                CardData: {
                    TokenData: {TokenValue: token},
                    TokenRequest: requestMultiUseToken ? 'Y' : 'N'
                },
                Amt: amount,
                CardHolderData: hydrateCardHolderData(cardHolder),
                AllowDup: 'Y',
                AdditionalTxnFields: {Description: memo}
            }
        }
    };

    submitAuthorization(transaction, amount, currency, callback);
    return this;
};

/**
 * A *credit account verify* transaction is used to verify that the account is in
 * good standing with the issuer. This is a zero dollar transaction with no associated
 * authorization. Since VISA and other issuers have started assessing penalties for
 * one dollar authorizations, this provides a way for merchants to accomplish the same
 * task while avoiding these penalties.
 *
 * * Examples:
 *
 *     var card = {
 *              cvv: 123,
 *              expMonth: 12,
 *              expYear: 2015,
 *              number: "...valid number"
 *         },
 *         cardHolder = {
 *              address: {
 *                  address: "One Heartland Way",
 *                  city: "Jeffersonville",
 *                  state: "IN",
 *                  zip: "47130",
 *                  country: "United States"
 *              },
 *              firstName: "First",
 *              lastName: "Last"
 *         };
 *
 *     hpsCreditService.verifyWithCard(card, cardHolder, function (err, result) {
 *          // Do something with the results...
 *     });
 *
 * @param {Object} card
 * @param {Object} cardHolder
 * @param {Function} callback
 * @return {Object} exports for chaining
 */
HpsCreditService.prototype.verifyWithCard = function (card, cardHolder, callback) {
    var transaction = {
        CreditAccountVerify: {
            Block1: {
                CardData: {
                    ManualEntry: hydrateCardManualEntry(card)
                },
                CardHolderData: hydrateCardHolderData(cardHolder)
            }
        }
    };

    submitVerify(transaction, callback);
    return this;
};

/**
 * A *Capture* transaction adds a previous authorization transaction to the current
 * open batch. Note: `amount` is optional. If set to null, the amount will be the
 * amount specified in the transaction referenced with `transactionId`. If a batch
 * is not open, this transaction will create one.
 *
 * * Examples:
 *
 *     var transactionId = 12345678910; // valid transaction ID (e.g. from prior authorization).
 *     hpsCreditService.capture(transactionId, 10.00, function (err, result) {
 *          // Do something with the results...
 *     });
 *
 * @param {Number} transactionId
 * @param {Number} amount
 * @param {Function} callback
 * @return {Object} exports for chaining
 */
HpsCreditService.prototype.capture = function (transactionId, amount, callback) {
    try { checkTransactionId(transactionId); } catch (transactionError) { callback(transactionError, null); return this; }

    var transaction = {CreditAddToBatch: {GatewayTxnId: transactionId}};
    if (amount) {
        try { checkAmount(amount); } catch (amountError) { callback(amountError, null); return this; }
        transaction.CreditAddToBatch.Amt = amount;
    }
    submitCapture(transaction, callback);
    return this;
};

/**
 * The *credit return transaction* returns funds to the cardholder. The transaction
 * is generally used as a counterpart to a credit card transaction that needs to be
 * reversed, and the batch containing the original transaction has already been
 * closed. The credit return transaction is placed in the current open batch. If a
 * batch is not open, this transaction will create an open batch.
 *
 * Note: `cardHolder` is optional and used if you'd like to perform AVS for the
 * refund transaction.
 *
 * * Examples:
 *
 *     var card = {
 *              cvv: 123,
 *              expMonth: 12,
 *              expYear: 2015,
 *              number: "...valid number"
 *         },
 *         cardHolder = {
 *              address: {
 *                  address: "One Heartland Way",
 *                  city: "Jeffersonville",
 *                  state: "IN",
 *                  zip: "47130",
 *                  country: "United States"
 *              },
 *              firstName: "First",
 *              lastName: "Last"
 *         };
 *
 *     hpsCreditService.refundWithCard(10.00, 'usd', card, cardHolder, 'a memo', function (err, result) {
 *          // Do something with the results...
 *     });
 *
 * @param {Number} amount
 * @param {String} currency
 * @param {Object} card
 * @param {Object} cardHolder
 * @param {String} memo
 * @param {Function} callback
 * @return {Object} exports for chaining
 */
HpsCreditService.prototype.refundWithCard = function (amount, currency, card, cardHolder, memo, callback) {
    try { checkAmount(amount); } catch (amountError) { callback(amountError, null); return this; }
    try { checkCurrency(currency); } catch (currencyError) { callback(currencyError, null); return this; }

    var transaction = {
        CreditReturn: {
            Block1: {
                CardData: {ManualEntry: hydrateCardManualEntry(card)},
                Amt: amount,
                AllowDup: 'Y',
                AdditionalTxnFields: {Description: memo}
            }
        }
    };

    if (cardHolder) { transaction.CreditReturn.Block1.CardHolderData = hydrateCardHolderData(cardHolder); }

    submitRefund(transaction, callback);
    return this;
};

/**
 * The *credit return transaction* returns funds to the cardholder. The transaction
 * is generally used as a counterpart to a credit card transaction that needs to be
 * reversed, and the batch containing the original transaction has already been
 * closed. The credit return transaction is placed in the current open batch. If a
 * batch is not open, this transaction will create an open batch.
 *
 * Note: `cardHolder` is optional and used if you'd like to perform AVS for the
 * refund transaction.
 *
 * * Examples:
 *
 *     var cardHolder = {
 *              address: {
 *                  address: "One Heartland Way",
 *                  city: "Jeffersonville",
 *                  state: "IN",
 *                  zip: "47130",
 *                  country: "United States"
 *              },
 *              firstName: "First",
 *              lastName: "Last"
 *         };
 *
 *     hpsCreditService.refundWithTransactionId(10.00, 'usd', 1234567, cardHolder, 'a memo', function (err, result) {
 *          // Do something with the results...
 *     });
 *
 * @param {Number} amount
 * @param {String} currency
 * @param {Number} transactionId
 * @param {Object} cardHolder
 * @param {String} memo
 * @param {Function} callback
 * @return {Object} exports for chaining
 */
HpsCreditService.prototype.refundWithTransactionId = function (amount, currency, transactionId, cardHolder, memo, callback) {
    try { checkAmount(amount); } catch (amountError) { callback(amountError, null); return this; }
    try { checkCurrency(currency); } catch (currencyError) { callback(currencyError, null); return this; }
    try { checkTransactionId(transactionId); } catch (transactionError) { callback(transactionError, null); return this; }

    var transaction = {
        CreditReturn: {
            Block1: {
                GatewayTxnId: transactionId,
                AllowDup: 'Y',
                Amt: amount,
                AdditionalTxnFields: {Description: memo}
            }
        }
    };

    if (cardHolder) { transaction.CreditReturn.Block1.CardHolderData = hydrateCardHolderData(cardHolder); }

    submitRefund(transaction, callback);
    return this;
};

/**
 * A *reverse* transaction reverses a *Charge* or *Authorize* transaction from the
 * active open authorizations or current open batch.
 *
 * * Examples:
 *
 *     var card = {
 *              cvv: 123,
 *              expMonth: 12,
 *              expYear: 2015,
 *              number: "...valid number"
 *         };
 *
 *     hpsCreditService.reverseWithCard(10.00, 'usd', card, 'a memo', function (err, result) {
 *          // Do something with the results...
 *     });
 *
 * @param {Number} amount
 * @param {String} currency
 * @param {Object} card
 * @param {String} memo
 * @param {Function} callback
 * @return {Object} exports for chaining
 */
HpsCreditService.prototype.reverseWithCard = function (amount, currency, card, memo, callback) {
    try { checkCurrency(currency); } catch (currencyError) { callback(currencyError, null); return this; }
    try { checkAmount(amount); } catch (amountError) { callback(amountError, null); return this; }

    var transaction = {
        CreditReversal: {
            Block1: {
                CardData: {ManualEntry: hydrateCardManualEntry(card)},
                Amt: amount,
                AdditionalTxnFields: {Description: memo}
            }
        }
    };

    submitReverse(transaction, callback);
    return this;
};

/**
 * A *reverse* transaction reverses a *Charge* or *Authorize* transaction from the
 * active open authorizations or current open batch.
 *
 * * Examples:
 *
 *     hpsCreditService.reverseWithTransactionId(10.00, 'usd', 12345678, 'a memo', function (err, result) {
 *          // Do something with the results...
 *     });
 *
 * @param {Number} amount
 * @param {String} currency
 * @param {Number} transactionId
 * @param {String} memo
 * @param {Function} callback
 * @return {Object} exports for chaining
 */
HpsCreditService.prototype.reverseWithTransactionId = function (amount, currency, transactionId, memo, callback) {
    try { checkTransactionId(transactionId); } catch (transactionError) { callback(transactionError, null); return this; }

    reverse(amount, currency, transactionId, memo, callback);
    return this;
};

exports.HpsCreditService = HpsCreditService;