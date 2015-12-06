'use strict';

var tv4 = require('tv4'),
	hlp = require('../infra/helpers'),
	porticoSchema = require('../infra/portico-schema'),
	exceptionMapper = require('../infra/exception-mapper');

function SecureSubmit(gateway) {
	var self = this;

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
			var schema = porticoSchema.requestTypes.CreditSale,
				tx = {};

			if (hlp.defNn(card)) {
				tx.CardData = {};
				tx.CardData.ManualEntry = hlp.hydrateCardManualEntry(card);
				tx.CardData.TokenRequest = requestMultiUseToken ? 'Y' : 'N'
			}
			tx.AllowDup = 'Y';
			if (hlp.defNn(cardHolder)) 	tx.CardHolderData = hlp.hydrateCardHolderData(cardHolder);
			if (hlp.defNn(memo)) 		tx.AdditionalTxnFields = { 'Description': memo };
			if (hlp.defNn(amount)) 		tx.Amt = amount;

			schema.required = ['Amt'];
			schema.properties.CardData.required = ['ManualEntry'];
			schema.properties.CardData.properties.ManualEntry.required = ['CardNbr', 'ExpMonth', 'ExpYear', 'CVV2'];

			if (tv4.validate(tx, schema)) {
				gateway.submitTransaction({CreditSale:{Block1:tx}}, function (err, result) {
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
			var tx = {
				CardData: {
					TokenData: {TokenValue: token},
					TokenRequest: requestMultiUseToken ? 'Y' : 'N'
				},
				CardHolderData: hlp.hydrateCardHolderData(cardHolder),
				AllowDup: 'Y',
				AdditionalTxnFields: {Description: memo}
			};

			try { (amount) ? hlp.checkAmount(amount, tx) : _throw(exceptionMapper.mapSdkException('missing_amount',null)); } catch (amountError) { callback(amountError, null); return self; }
			try { (currency) ? hlp.checkCurrency(currency) : _throw(exceptionMapper.mapSdkException('missing_currency',null)); } catch (currencyError) { callback(currencyError, null); return self; }

			gateway.submitTransaction({CreditSale:{Block1:tx}}, function (err, result) {
				if (err) {
					callback(err, null);
				} else {
					var h = result.header, b = result.body.CreditSale;
					processAuth(h, b, amount, currency, callback);
				}
			});

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
			var tx = {
				CardData: {
					ManualEntry: hlp.hydrateCardManualEntry(card),
					TokenRequest: requestMultiUseToken ? 'Y' : 'N'
				},
				CardHolderData: hlp.hydrateCardHolderData(cardHolder),
				AllowDup: 'Y',
				AdditionalTxnFields: {Description: memo}
			};

			try { (amount) ? hlp.checkAmount(amount, tx) : _throw(exceptionMapper.mapSdkException('missing_amount',null)); } catch (amountError) { callback(amountError, null); return self; }
			try { (currency) ? hlp.checkCurrency(currency) : _throw(exceptionMapper.mapSdkException('missing_currency',null)); } catch (currencyError) { callback(currencyError, null); return self; }

			gateway.submitTransaction({CreditAuth:{Block1:tx}}, function (err, result) {
				if (err) {
					callback(err, null);
				} else {
					var h = result.header, b = result.body.CreditAuth;
					processAuth(h, b, amount, currency, callback);
				}
			});

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
			var tx = {
				CardData: {
					TokenData: {TokenValue: token},
					TokenRequest: requestMultiUseToken ? 'Y' : 'N'
				},
				CardHolderData: hlp.hydrateCardHolderData(cardHolder),
				AllowDup: 'Y',
				AdditionalTxnFields: {Description: memo}
			};

			try { (amount) ? hlp.checkAmount(amount, tx) : _throw(exceptionMapper.mapSdkException('missing_amount',null)); } catch (amountError) { callback(amountError, null); return self; }
			try { (currency) ? hlp.checkCurrency(currency) : _throw(exceptionMapper.mapSdkException('missing_currency',null)); } catch (currencyError) { callback(currencyError, null); return self; }

			gateway.submitTransaction({CreditAuth:{Block1:tx}}, function (err, result) {
				if (err) {
					callback(err, null);
				} else {
					var h = result.header, b = result.body.CreditAuth;
					processAuth(h, b, amount, currency, callback);
				}
			});

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
			var tx = {
				CardData: {
					ManualEntry: hlp.hydrateCardManualEntry(card),
					TokenRequest: requestMultiUseToken ? 'Y' : 'N'
				},
				CardHolderData: hlp.hydrateCardHolderData(cardHolder)
			};

			gateway.submitTransaction({CreditAccountVerify:{Block1:tx}}, function (err, result) {
				if (err) {
					callback(err, null);
				} else {
					var h = result.header, b = result.body.CreditAccountVerify;
					callback(null, hlp.hydrateAuthResult(h, b));
				}
			});

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
			var tx = {
				CardData: {
					TokenData: { TokenValue: token },
					TokenRequest: requestMultiUseToken ? 'Y' : 'N'
				},
				CardHolderData: hlp.hydrateCardHolderData(cardHolder)
			};

			gateway.submitTransaction({CreditAccountVerify:{Block1:tx}}, function (err, result) {
				if (err) {
					callback(err, null);
				} else {
					var h = result.header, b = result.body.CreditAccountVerify;
					callback(null, hlp.hydrateAuthResult(h, b));
				}
			});

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
			var tx = {};

			try { (transactionId) ? hlp.checkGatewayTxnId(transactionId, tx) : _throw(exceptionMapper.mapSdkException('missing_transaction_id', null)); } 
			catch (transactionError) { callback(transactionError, null); return self; }

			try { (amount) ? hlp.checkAmount(amount, tx) : null; } 
			catch (amountError) { callback(amountError, null); return self; }

			gateway.submitTransaction({CreditAddToBatch: tx}, function (err, captureResult) {
				if (err) {
					callback(err, null);
				} else {
					submitGet({ReportTxnDetail: {TxnId: tx.GatewayTxnId}}, function (err, getResult) {
						if (err) {
							callback(null, captureResult);
						} else {
							callback(null, getResult);
						}
					});
				}
			});

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
			var tx = {
				CardData: {ManualEntry: hlp.hydrateCardManualEntry(card)},
				AllowDup: 'Y',
				AdditionalTxnFields: {Description: memo}
			};

			try { (amount) ? hlp.checkAmount(amount, tx) : _throw(exceptionMapper.mapSdkException('missing_amount', null)); }
			catch (amountError) { callback(amountError, null); return self; }
			
			try { (currency) ? hlp.checkCurrency(currency) : _throw(exceptionMapper.mapSdkException('missing_currency', null)); }
			catch (currencyError) { callback(currencyError, null); return self; }

			if (cardHolder) tx.CardHolderData      = hlp.hydrateCardHolderData(cardHolder);

			gateway.submitTransaction({CreditReturn:{Block1:tx}}, function (err, result) {
				if (err) {
					callback(err, null);
				} else {
					callback(null, {
						transactionId: result.header.GatewayTxnId
					});
				}
			});

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
			var tx= {
				AllowDup: 'Y',
				AdditionalTxnFields: {Description: memo}
			};

			try { (amount) ? hlp.checkAmount(amount, tx) : _throw(exceptionMapper.mapSdkException('missing_amount', null)); }
			catch (amountError) { callback(amountError, null); return self; }

			try { (currency) ? hlp.checkCurrency(currency) : _throw(exceptionMapper.mapSdkException('missing_currency', null)); }
			catch (currencyError) { callback(currencyError, null); return self; }
			
			try { (transactionId) ? hlp.checkGatewayTxnId(transactionId, tx) : _throw(exceptionMapper.mapSdkException('missing_transaction_id', null)); }
			catch (transactionError) { callback(transactionError, null); return self; }

			if (cardHolder) tx.CardHolderData = hlp.hydrateCardHolderData(cardHolder);

			gateway.submitTransaction({CreditReturn:{Block1:tx}}, function (err, result) {
				if (err) {
					callback(err, null);
				} else {
					callback(null, { transactionId: result.header.GatewayTxnId });
				}
			});
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
			var tx = {
				CardData: {ManualEntry: hlp.hydrateCardManualEntry(card)},
				AdditionalTxnFields: {Description: memo}
			};

			try { (currency) ? hlp.checkCurrency(currency) : _throw(exceptionMapper.mapSdkException('missing_currency', null)); }
			catch (currencyError) { callback(currencyError, null); return self; }
			
			try { (amount) ? hlp.checkAmount(amount, tx) : _throw(exceptionMapper.mapSdkException('missing_amount', null)); }
			catch (amountError) { callback(amountError, null); return self; }

			gateway.submitTransaction({CreditReversal:{Block1:tx}}, function (err, result) {
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
			var tx = {
				AdditionalTxnFields: {Description: memo}
			};

			try { (amount) ? hlp.checkAmount(amount, tx) : _throw(exceptionMapper.mapSdkException('missing_amount', null)); }
			catch (amountError) { callback(amountError, null); return self; }

			try { (currency) ? hlp.checkCurrency(currency) : _throw(exceptionMapper.mapSdkException('missing_currency', null)); }
			catch (currencyError) { callback(currencyError, null); return self; }
			
			try { (transactionId) ? hlp.checkGatewayTxnId(transactionId, tx) : _throw(exceptionMapper.mapSdkException('missing_transaction_id', null)); }
			catch (transactionError) { callback(transactionError, null); return self; }

			gateway.submitTransaction({CreditReversal:{Block1:tx}}, function (err, result) {
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

			return self;
		};

	var closeBatch = 
		function closeBatch(callback) {
			gateway.submitTransaction({BatchClose:{}}, function (err, result) {
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
			var tx = {}

			try { (transactionId) ? hlp.checkTxnId(transactionId, tx) : _throw(exceptionMapper.mapSdkException('missing_transaction_id', null)); }
			catch (transactionError) { callback(transactionError, null); return self; }

			submitGet({ReportTxnDetail:tx}, callback);
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

			gateway.submitTransaction(transaction, function (err, result) {
				if (err) {
					callback(err, null);
				} else {
					h = result.header;
					b = result.body;
					serviceName = filterBy ? hlp.transactionTypeToServiceName(filterBy) : '';
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

	function _throw(e) {
		throw e;
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
		closeBatch: closeBatch,
		get: get,
		list: list
	};
};


module.exports = SecureSubmit;