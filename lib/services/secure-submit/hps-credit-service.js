'use strict';

var _ = require('lodash'),
    tv4 = require('tv4'),
    hlp = require('../../infrastructure/helpers'),
    porticoSchema = require('../../infrastructure/validation/portico-schema'),
    exceptionMapper = require('../../infrastructure/exception-mapper'),
    PorticoGateway = require('../portico-gateway');

function HpsCreditService(hpsConfig, soapUri) {
    var self = this,
        gateway = new PorticoGateway(hpsConfig, soapUri);

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
     *     secureSubmit.chargeWithCard(10.00, 'usd', card, cardHolder, false, null, function (err, result) {
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
    var chargeWithCard =
        function chargeWithCard(amount, currency, card, cardHolder, requestMultiUseToken, memo, callback) {
            var schema = porticoSchema.requestType('CreditSale'),
                tx = {};

            if (hlp.defNn(card)) {
                tx.CardData = {};
                tx.CardData.ManualEntry = hlp.hydrateCardData(card);
                if(hlp.defNn(requestMultiUseToken)) tx.CardData.TokenRequest = (requestMultiUseToken === true) ? 'Y': 'N';
            }
            if (hlp.defNn(amount))      tx.Amt = amount;
            if (hlp.defNn(cardHolder))  tx.CardHolderData = hlp.hydrateCardHolderData(cardHolder);
            if (hlp.defNn(memo))        tx.AdditionalTxnFields = { 'Description': memo };
            tx.AllowDup = 'Y';

            schema.required = ['Amt'];
            schema.properties.CardData.required = ['ManualEntry'];
            schema.properties.CardData.properties.ManualEntry.required = ['CardNbr', 'ExpMonth', 'ExpYear', 'CVV2'];

            if (tv4.validate(tx, schema)) {
                gateway.submitTransaction({'CreditSale':{'Block1':tx}}, function (err, result) {
                    if (err) {
                        callback(err, null);
                    } else {
                        var h = result.header, b = result.body.CreditSale;
                        processAuth(h, b, amount, currency, callback);
                    }
                });
            } else {
                callback(tv4.error, null);
            }

            return self;
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
     *     secureSubmit.chargeWithToken(10.00, 'usd', token, cardHolder, false, null, function (err, result) {
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
    var chargeWithToken =
        function chargeWithToken(amount, currency, token, cardHolder, requestMultiUseToken, memo, callback) {
            var schema = porticoSchema.requestType('CreditSale'),
                tx = { };

            if (hlp.defNn(token)) {
                tx.CardData = {};
                tx.CardData.TokenData = hlp.hydrateCardData({'token': token});
                if(hlp.defNn(requestMultiUseToken)) tx.CardData.TokenRequest = (requestMultiUseToken === true) ? 'Y': 'N';
            }
            if (hlp.defNn(amount))      tx.Amt = amount;
            if (hlp.defNn(cardHolder))  tx.CardHolderData = hlp.hydrateCardHolderData(cardHolder);
            if (hlp.defNn(memo))        tx.AdditionalTxnFields = { 'Description': memo };
            tx.AllowDup = 'Y';

            schema.required = ['Amt'];
            schema.properties.CardData.required = ['TokenData'];
            schema.properties.CardData.properties.TokenData.required = ['TokenValue'];

            if (tv4.validate(tx, schema)) {
                gateway.submitTransaction({'CreditSale':{'Block1':tx}}, function (err, result) {
                    if (err) {
                        callback(err, null);
                    } else {
                        var h = result.header, b = result.body.CreditSale;
                        processAuth(h, b, amount, currency, callback);
                    }
                });
            } else {
                callback(tv4.error, null);
            }

            return self;
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
     *     secureSubmit.authorizeWithCard(10.00, 'usd', card, cardHolder, false, null, function (err, result) {
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
    var authorizeWithCard =
        function authorizeWithCard(amount, currency, card, cardHolder, requestMultiUseToken, memo, callback) {
            var schema = porticoSchema.requestType('CreditAuth'),
                tx = {};

            if (hlp.defNn(card)) {
                tx.CardData = {};
                tx.CardData.ManualEntry = hlp.hydrateCardData(card);
                if(hlp.defNn(requestMultiUseToken)) tx.CardData.TokenRequest = (requestMultiUseToken === true) ? 'Y': 'N';
            }
            if (hlp.defNn(amount))      tx.Amt = amount;
            if (hlp.defNn(cardHolder))  tx.CardHolderData = hlp.hydrateCardHolderData(cardHolder);
            if (hlp.defNn(memo))        tx.AdditionalTxnFields = { 'Description': memo };
            tx.AllowDup = 'Y';

            schema.required = ['Amt'];
            schema.properties.CardData.required = ['ManualEntry'];
            schema.properties.CardData.properties.ManualEntry.required = ['CardNbr', 'ExpMonth', 'ExpYear'];

            if (tv4.validate(tx, schema)) {
                gateway.submitTransaction({'CreditAuth':{'Block1':tx}}, function (err, result) {
                    if (err) {
                        callback(err, null);
                    } else {
                        var h = result.header, b = result.body.CreditAuth;
                        processAuth(h, b, amount, currency, callback);
                    }
                });
            } else {
                callback(tv4.error, null);
            }

            return self;
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
     *     secureSubmit.authorizeWithToken(10.00, 'usd', token, cardHolder, false, null, function (err, result) {
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
    var authorizeWithToken =
        function authorizeWithToken(amount, currency, token, cardHolder, requestMultiUseToken, memo, callback) {
            var schema = porticoSchema.requestType('CreditAuth'),
                tx = { };

            if (hlp.defNn(token)) {
                tx.CardData = {};
                tx.CardData.TokenData = hlp.hydrateCardData({'token': token});
                if(hlp.defNn(requestMultiUseToken)) tx.CardData.TokenRequest = (requestMultiUseToken === true) ? 'Y': 'N';
            }
            if (hlp.defNn(amount))      tx.Amt = amount;
            if (hlp.defNn(cardHolder))  tx.CardHolderData = hlp.hydrateCardHolderData(cardHolder);
            if (hlp.defNn(memo))        tx.AdditionalTxnFields = { 'Description': memo };
            tx.AllowDup = 'Y';

            schema.required = ['Amt'];
            schema.properties.CardData.required = ['TokenData'];
            schema.properties.CardData.properties.TokenData.required = ['TokenValue'];

            if (tv4.validate(tx, schema)) {
                gateway.submitTransaction({'CreditAuth':{'Block1':tx}}, function (err, result) {
                    if (err) {
                        callback(err, null);
                    } else {
                        var h = result.header, b = result.body.CreditAuth;
                        processAuth(h, b, amount, currency, callback);
                    }
                });
            } else {
                callback(tv4.error, null);
            }

            return self;
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
     *     secureSubmit.verifyWithCard(card, cardHolder, function (err, result) {
     *          // Do something with the results...
     *     });
     *
     * @param {Object} card
     * @param {Object} cardHolder
     * @param {Boolean} requestMultiUseToken
     * @param {Function} callback
     * @return {Object} exports for chaining
     */
    var verifyWithCard =
        function verifyWithCard(card, cardHolder, requestMultiUseToken, callback) {
            var schema = porticoSchema.requestType('CreditAccountVerify'),
                tx = {};

            if (hlp.defNn(card)) {
                tx.CardData = {};
                tx.CardData.ManualEntry = hlp.hydrateCardData(card);
                if(hlp.defNn(requestMultiUseToken)) tx.CardData.TokenRequest = (requestMultiUseToken === true) ? 'Y': 'N';
            }
            if (hlp.defNn(cardHolder))  tx.CardHolderData = hlp.hydrateCardHolderData(cardHolder);

            schema.properties.CardData.required = ['ManualEntry'];
            schema.properties.CardData.properties.ManualEntry.required = ['CardNbr', 'ExpMonth', 'ExpYear'];

            if (tv4.validate(tx, schema)) {
                gateway.submitTransaction({'CreditAccountVerify':{'Block1':tx}}, function (err, result) {
                    if (err) {
                        callback(err, null);
                    } else {
                        var h = result.header, b = result.body.CreditAccountVerify;
                        callback(null, hlp.hydrateAuthResult(h, b));
                    }
                });
            } else {
                callback(tv4.error, null);
            }

            return self;
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
     *     secureSubmit.verifyWithToken(token, cardHolder, function (err, result) {
     *          // Do something with the results...
     *     });
     *
     * @param {Object} card
     * @param {Object} cardHolder
     * @param {Boolean} requestMultiUseToken
     * @param {Function} callback
     * @return {Object} exports for chaining
     */
    var verifyWithToken =
        function verifyWithToken(token, cardHolder, requestMultiUseToken, callback) {
            var schema = porticoSchema.requestType('CreditAccountVerify'),
                tx = { };

            if (hlp.defNn(token)) {
                tx.CardData = {};
                tx.CardData.TokenData = hlp.hydrateCardData({'token': token});
                if(hlp.defNn(requestMultiUseToken)) tx.CardData.TokenRequest = (requestMultiUseToken === true) ? 'Y': 'N';
            }
            if (hlp.defNn(cardHolder))  tx.CardHolderData = hlp.hydrateCardHolderData(cardHolder);

            schema.properties.CardData.required = ['TokenData'];
            schema.properties.CardData.properties.TokenData.required = ['TokenValue'];

            if (tv4.validate(tx, schema)) {
                gateway.submitTransaction({'CreditAccountVerify':{'Block1':tx}}, function (err, result) {
                    if (err) {
                        callback(err, null);
                    } else {
                        var h = result.header, b = result.body.CreditAccountVerify;
                        callback(null, hlp.hydrateAuthResult(h, b));
                    }
                });
            } else {
                callback(tv4.error, null);
            }

            return self;
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
     *     secureSubmit.capture(transactionId, 10.00, function (err, result) {
     *          // Do something with the results...
     *     });
     *
     * @param {Number} transactionId
     * @param {Number} amount
     * @param {Function} callback
     * @return {Object} exports for chaining
     */
    var capture =
        function capture(transactionId, amount, callback) {
            var schema = porticoSchema.requestType('CreditAddToBatch'),
                tx = {};

            if (hlp.defNn(transactionId))   tx.GatewayTxnId = transactionId;
            if (hlp.defNn(amount))          tx.Amt = amount;

            schema.required = ['GatewayTxnId'];

            if (tv4.validate(tx, schema)) {
                gateway.submitTransaction({'CreditAddToBatch': tx}, function (err, captureResult) {
                    if (err) {
                        callback(err, null);
                    } else {
                        submitGet({'ReportTxnDetail': {'TxnId': tx.GatewayTxnId}}, function (err, getResult) {
                            if (err) {
                                callback(null, captureResult);
                            } else {
                                callback(null, getResult);
                            }
                        });
                    }
                });
            } else {
                callback(tv4.error, null);
            }

            return self;
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
     *     secureSubmit.refundWithCard(10.00, 'usd', card, cardHolder, 'a memo', function (err, result) {
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
    var refundWithCard =
        function refundWithCard(amount, currency, card, cardHolder, memo, callback) {
            var schema = porticoSchema.requestType('CreditReturn'),
                tx = {};

            if (hlp.defNn(card)) {
                tx.CardData = {};
                tx.CardData.ManualEntry = hlp.hydrateCardData(card);
            }
            if (hlp.defNn(amount))      tx.Amt = amount;
            if (hlp.defNn(cardHolder))  tx.CardHolderData = hlp.hydrateCardHolderData(cardHolder);
            if (hlp.defNn(memo))        tx.AdditionalTxnFields = { 'Description': memo };
            tx.AllowDup = 'Y';

            schema.required = ['Amt'];
            schema.properties.CardData.properties.ManualEntry.required = ['CardNbr', 'ExpMonth', 'ExpYear'];

            if (tv4.validate(tx, schema)) {
                gateway.submitTransaction({'CreditReturn':{'Block1':tx}}, function (err, result) {
                    if (err) {
                        callback(err, null);
                    } else {
                        callback(null, {
                            transactionId: result.header.GatewayTxnId
                        });
                    }
                });
            } else {
                callback(tv4.error, null);
            }

            return self;
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
     *     secureSubmit.refundWithTransactionId(10.00, 'usd', 1234567, cardHolder, 'a memo', function (err, result) {
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
    var refundWithTransactionId =
        function refundWithTransactionId(amount, currency, transactionId, cardHolder, memo, callback) {
            var schema = porticoSchema.requestType('CreditReturn'),
                tx = {};

            if (hlp.defNn(transactionId))   tx.GatewayTxnId = transactionId;
            if (hlp.defNn(amount))          tx.Amt = amount;
            if (hlp.defNn(cardHolder))      tx.CardHolderData = hlp.hydrateCardHolderData(cardHolder);
            if (hlp.defNn(memo))            tx.AdditionalTxnFields = { 'Description': memo };
            tx.AllowDup = 'Y';

            schema.required = ['GatewayTxnId', 'Amt'];

            if (tv4.validate(tx, schema)) {
                gateway.submitTransaction({'CreditReturn':{'Block1':tx}}, function (err, result) {
                    if (err) {
                        callback(err, null);
                    } else {
                        callback(null, { transactionId: result.header.GatewayTxnId });
                    }
                });
            } else {
                callback(tv4.error, null);
            }

            return self;
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
     *     secureSubmit.reverseWithCard(10.00, 'usd', card, 'a memo', function (err, result) {
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
    var reverseWithCard =
        function reverseWithCard(amount, currency, card, memo, callback) {
            var schema = porticoSchema.requestType('CreditReversal'),
                tx = {};

            if (hlp.defNn(card)) {
                tx.CardData = {};
                tx.CardData.ManualEntry = hlp.hydrateCardData(card);
            }

            if (hlp.defNn(amount))      tx.Amt = amount;
            if (hlp.defNn(memo))        tx.AdditionalTxnFields = { 'Description': memo };

            schema.required = ['Amt'];
            schema.properties.CardData.properties.ManualEntry.required = ['CardNbr', 'ExpMonth', 'ExpYear'];

            if (tv4.validate(tx, schema)) {
                gateway.submitTransaction({'CreditReversal':{'Block1':tx}}, function (err, result) {
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
            } else {
                callback(tv4.error, null);
            }

            return self;
        };

    /**
     * A *reverse* transaction reverses a *Charge* or *Authorize* transaction from the
     * active open authorizations or current open batch.
     *
     * * Examples:
     *
     *     secureSubmit.reverseWithTransactionId(10.00, 'usd', 12345678, 'a memo', function (err, result) {
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
    var reverseWithTransactionId =
        function reverseWithTransactionId(amount, currency, transactionId, memo, callback) {
            var schema = porticoSchema.requestType('CreditReversal'),
                tx = { };

            if (hlp.defNn(amount))          tx.Amt = amount;
            if (hlp.defNn(transactionId))   tx.GatewayTxnId = transactionId;
            if (hlp.defNn(memo))            tx.AdditionalTxnFields = { 'Description': memo };

            schema.required = ['Amt'];

            if (tv4.validate(tx, schema)) {
                gateway.submitTransaction({'CreditReversal':{'Block1':tx}}, function (err, result) {
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
            } else {
                callback(tv4.error, null);
            }

            return self;
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
                        callback(null, hlp.hydrateAuthResult(h, b));
                    }
                });
            }
        });
    };

    function checkForAuthGatewayError(responseCode, responseText, transactionId, amount, currency, callback) {
        if (responseCode !== 0) {
            /* If we get a timeout from the gateway, perform a credit reversal to back out any pending charges. */
            if (responseCode === 30) {
                reverseWithTransactionId(amount, currency, transactionId, null, function (err) {
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
                reverseWithTransactionId(amount, currency, transactionId, null, function (err) {
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

    /**
     * Gets an HPS transaction given a `transactionId`. Use the `callback` to process the result.
     *
     * * Example:
     *
     *     secureSubmit.get(12345, function (err, result) {
     *         // Do something with the result...
     *     });
     *
     * @param {Number} transactionId
     * @param {Function} callback
     * @return {Object} exports for chaining
     */
    var get =
        function get(transactionId, callback) {
            var schema = porticoSchema.requestType('ReportTxnDetail'),
                tx = {};

            if (hlp.defNn(transactionId))   tx.TxnId = transactionId;

            schema.required = ['TxnId'];

            if (tv4.validate(tx, schema)) {
                submitGet({'ReportTxnDetail':tx}, callback);
            } else {
                callback(tv4.error, null);
            }

            return self;
        };

    /**
     * Gets an array transaction summaries between UTC `startDate` and `endDate`. Use `filterBy`
     * to filter results to a particular transaction type (e.g. 'charge' or 'capture').
     *
     * * Examples:
     *
     *     var startDate = new Date(), endDate = new Date();
     *     startDate.setDate(startDate.getDate() - 1);
     *     secureSubmit.list(startDate.toISOString(), endDate.toISOString(), null, function (err, result) {
     *          // Do something with the results...
     *     }
     *
     * @param {String} startDate
     * @param {String} endDate
     * @param {String} filterBy
     * @param {Function} callback
     * @return {Object} exports for chaining
     */
    var list =
        function list(startDate, endDate, filterBy, callback) {
            var schema = porticoSchema.requestType('ReportActivity'),
                tx = {}, serviceName, transactionList = [], h, b, t, i, len;

            if (hlp.defNn(startDate))   tx.RptStartUtcDT = startDate;
            if (hlp.defNn(endDate))     tx.RptEndUtcDT = endDate;

            if (tv4.validate(tx, schema)) {
                gateway.submitTransaction({'ReportActivity':tx}, function (err, result) {
                    if (err) {
                        callback(err, null);
                    } else {
                        h = result.header;
                        b = result.body;
                        serviceName = filterBy ? hlp.transactionTypeToServiceName(filterBy) : '';
                        for (i = 0, len = _.get(b, 'ReportActivity.Details.length', 0); i < len; i++) {
                            t = b.ReportActivity.Details[i];
                            if (!filterBy || t.ServiceName === serviceName) {
                                transactionList.push({
                                    transactionId: t.GatewayTxnId,
                                    originalTransactionId: t.OriginalGatewayTxnId,
                                    maskedCardNumber: t.MaskedCardNbr,
                                    responseCode: hlp.isEmptyObject(t.IssuerRspCode)?(hlp.isEmptyObject(t.GatewayRspCode)?'':t.GatewayRspCode):t.IssuerRspCode,
                                    responseText: hlp.isEmptyObject(t.IssuerRspText)?(hlp.isEmptyObject(t.GatewayRspMsg)?'':t.GatewayRspMsg):t.IssuerRspText,
                                    amount: t.Amt,
                                    settlementAmount: t.SettlementAmt,
                                    status: t.status,
                                    transactionUtcDate: t.TxnUtcDT,
                                    transactionType: filterBy || hlp.serviceNameToTransactionType(t.ServiceName),
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
            } else {
                callback(tv4.error, null);
            }

            return self;
        };

    /**
     * Allows for multi-use tokens to have their expiration date updated within Heartland's servers
     *
     * @param {String}   tokenValue
     * @param {Number}   expMonth
     * @param {Number}   expYear
     * @param {Function} callback
     *
     * @return {Object}
     */
    var updateTokenExpiration =
        function (tokenValue, expMonth, expYear, callback) {
            var schema = porticoSchema.requestType('ManageTokens'),
                tx = {},
                Attribute1 = {},
                Attribute2 = {},
                transactionRslt = {},
                t;
            if (hlp.defNn(tokenValue)) {
                tx.TokenValue = tokenValue;
            }
            if (hlp.defNn(expMonth) && hlp.defNn(expYear)) {
                tx.TokenActions = {
                    Set: {
                        Attribute: [
                            { 'tns:Name': 'ExpMonth', 'tns:Value': expMonth },
                            { 'tns:Name': 'ExpYear',  'tns:Value': expYear }
                        ]
                    }
                };
            }

            if (tv4.validate(tx, schema)) {
                gateway.submitTransaction({ManageTokens: tx}, function (err, result) {
                    if (err) {
                        callback(err, null);
                    } else {
                        t = result.header;
                        transactionRslt = {
                            transactionId: t.GatewayTxnId,
                            responseCode: t.GatewayRspCode,
                            responseText: t.GatewayRspMsg.join(' '),
                            transactionType: 'ManageTokens'
                        };
                        callback(null, transactionRslt);
                    }
                });
            } else {
                callback(tv4.error, null);
            }

            return self;
        };

    function submitGet(transaction, callback) {
        gateway.submitTransaction(transaction, function (err, result) {
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
                    transactionType: hlp.serviceNameToTransactionType(t.ServiceName),
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
                    exceptions: (t.GatewayRspCode !== 0 && t.GatewayRspCode !== '0') ? {
                        hpsException: exceptionMapper.mapGatewayException(t.GatewayTxnId, t.GatewayRspCode, t.GatewayRspMsg)
                    } : undefined
                };

                callback(null, result);
            }
        });
    };

    return {
        chargeWithCard: chargeWithCard,
        chargeWithToken: chargeWithToken,
        authorizeWithCard: authorizeWithCard,
        authorizeWithToken: authorizeWithToken,
        verifyWithCard: verifyWithCard,
        verifyWithToken: verifyWithToken,
        capture: capture,
        refundWithCard: refundWithCard,
        refundWithTransactionId: refundWithTransactionId,
        reverseWithCard: reverseWithCard,
        reverseWithTransactionId: reverseWithTransactionId,
        get: get,
        list: list,
        updateTokenExpiration: updateTokenExpiration
    };
};


module.exports = HpsCreditService;
