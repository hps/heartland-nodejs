'use strict';

var HpsService = require('./hps-service').HpsService,
    Gateway = require('../infrastructure/gateway'),
    helpers = require('../infrastructure/helpers'),
    exceptionMapper = require('../infrastructure/exception-mapper'),
    hpsService,gateway,
    HpsCreditService = function (hpsServicesConfig, soapUri) {
        hpsService = new HpsService(hpsServicesConfig, soapUri);
        gateway = new Gateway(hpsService, helpers, exceptionMapper);
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
    try { helpers.checkAmount(amount); } catch (amountError) { callback(amountError, null); return this; }
    try { helpers.checkCurrency(currency); } catch (currencyError) { callback(currencyError, null); return this; }

    var transaction = {
        CreditSale: {
            Block1: {
                CardData: {
                    ManualEntry: helpers.hydrateCardManualEntry(card),
                    TokenRequest: requestMultiUseToken ? 'Y' : 'N'
                },
                Amt: amount,
                CardHolderData: helpers.hydrateCardHolderData(cardHolder),
                AllowDup: 'Y',
                AdditionalTxnFields: {Description: memo}
            }
        }
    };

    gateway.creditSale(transaction, amount, currency, callback);
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
    try { helpers.checkAmount(amount); } catch (amountError) { callback(amountError, null); return this; }
    try { helpers.checkCurrency(currency); } catch (currencyError) { callback(currencyError, null); return this; }

    var transaction = {
        CreditSale: {
            Block1: {
                CardData: {
                    TokenData: {TokenValue: token},
                    TokenRequest: requestMultiUseToken ? 'Y' : 'N'
                },
                Amt: amount,
                CardHolderData: helpers.hydrateCardHolderData(cardHolder),
                AllowDup: 'Y',
                AdditionalTxnFields: {Description: memo}
            }
        }
    };

    gateway.creditSale(transaction, amount, currency, callback);
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
    try { helpers.checkAmount(amount); } catch (amountError) { callback(amountError, null); return this; }
    try { helpers.checkCurrency(currency); } catch (currencyError) { callback(currencyError, null); return this; }

    var transaction = {
        CreditAuth: {
            Block1: {
                CardData: {
                    ManualEntry: helpers.hydrateCardManualEntry(card),
                    TokenRequest: requestMultiUseToken ? 'Y' : 'N'
                },
                Amt: amount,
                CardHolderData: helpers.hydrateCardHolderData(cardHolder),
                AllowDup: 'Y',
                AdditionalTxnFields: {Description: memo}
            }
        }
    };

    gateway.creditAuth(transaction, amount, currency, callback);
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
    try { helpers.checkAmount(amount); } catch (amountError) { callback(amountError, null); return this; }
    try { helpers.checkCurrency(currency); } catch (currencyError) { callback(currencyError, null); return this; }

    var transaction = {
        CreditAuth: {
            Block1: {
                CardData: {
                    TokenData: {TokenValue: token},
                    TokenRequest: requestMultiUseToken ? 'Y' : 'N'
                },
                Amt: amount,
                CardHolderData: helpers.hydrateCardHolderData(cardHolder),
                AllowDup: 'Y',
                AdditionalTxnFields: {Description: memo}
            }
        }
    };

    gateway.creditAuth(transaction, amount, currency, callback);
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
 * @param {Boolean} requestMultiUseToken
 * @param {Function} callback
 * @return {Object} exports for chaining
 */
HpsCreditService.prototype.verifyWithCard = function (card, cardHolder, requestMultiUseToken, callback) {
    var transaction = {
        CreditAccountVerify: {
            Block1: {
                CardData: {
                    ManualEntry: helpers.hydrateCardManualEntry(card),
                    TokenRequest: requestMultiUseToken ? 'Y' : 'N'
                },
                CardHolderData: helpers.hydrateCardHolderData(cardHolder)
            }
        }
    };

    gateway.creditAccountVerify(transaction, callback);
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
 *     hpsCreditService.verifyWithToken(token, cardHolder, function (err, result) {
 *          // Do something with the results...
 *     });
 *
 * @param {Object} card
 * @param {Object} cardHolder
 * @param {Boolean} requestMultiUseToken
 * @param {Function} callback
 * @return {Object} exports for chaining
 */
HpsCreditService.prototype.verifyWithToken = function (token, cardHolder, requestMultiUseToken, callback) {
    var transaction = {
        CreditAccountVerify: {
            Block1: {
                CardData: {
                    TokenData: { TokenValue: token },
                    TokenRequest: requestMultiUseToken ? 'Y' : 'N'
                },
                CardHolderData: helpers.hydrateCardHolderData(cardHolder)
            }
        }
    };

    gateway.creditAccountVerify(transaction, callback);
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
    try { helpers.checkTransactionId(transactionId); } catch (transactionError) { callback(transactionError, null); return this; }

    var transaction = {
        CreditAddToBatch: {
            GatewayTxnId: transactionId
        }
    };
    
    if (amount) {
        try { helpers.checkAmount(amount); } catch (amountError) { callback(amountError, null); return this; }
        transaction.CreditAddToBatch.Amt = amount;
    }

    gateway.creditAddToBatch(transaction, callback);
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
    try { helpers.checkAmount(amount); } catch (amountError) { callback(amountError, null); return this; }
    try { helpers.checkCurrency(currency); } catch (currencyError) { callback(currencyError, null); return this; }

    var transaction = {
        CreditReturn: {
            Block1: {
                CardData: {ManualEntry: helpers.hydrateCardManualEntry(card)},
                Amt: amount,
                AllowDup: 'Y',
                AdditionalTxnFields: {Description: memo}
            }
        }
    };

    if (cardHolder) { transaction.CreditReturn.Block1.CardHolderData = helpers.hydrateCardHolderData(cardHolder); }

    gateway.creditReturn(transaction, callback);
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
    try { helpers.checkAmount(amount); } catch (amountError) { callback(amountError, null); return this; }
    try { helpers.checkCurrency(currency); } catch (currencyError) { callback(currencyError, null); return this; }
    try { helpers.checkTransactionId(transactionId); } catch (transactionError) { callback(transactionError, null); return this; }

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

    if (cardHolder) { transaction.CreditReturn.Block1.CardHolderData = helpers.hydrateCardHolderData(cardHolder); }

    gateway.creditReturn(transaction, callback);
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
    try { helpers.checkCurrency(currency); } catch (currencyError) { callback(currencyError, null); return this; }
    try { helpers.checkAmount(amount); } catch (amountError) { callback(amountError, null); return this; }

    var transaction = {
        CreditReversal: {
            Block1: {
                CardData: {ManualEntry: helpers.hydrateCardManualEntry(card)},
                Amt: amount,
                AdditionalTxnFields: {Description: memo}
            }
        }
    };

    gateway.creditReversal(transaction, callback);
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
    try { helpers.checkTransactionId(transactionId); } catch (transactionError) { callback(transactionError, null); return this; }

    gateway.reverse(amount, currency, transactionId, memo, callback);
    return this;
};

exports.HpsCreditService = HpsCreditService;
