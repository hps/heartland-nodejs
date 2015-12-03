'use strict';

var Helpers = {
	checkAmount:
		function checkAmount(amount) {
			if (amount === null || amount === undefined || amount < 0) {
				throw exceptionMapper.mapSdkException('invalid_amount', null);
			}
		},

	checkCurrency:
		function checkCurrency(currency) {
			if (!currency) {
				throw exceptionMapper.mapSdkException('missing_currency', null);
			} else if (currency.toLowerCase() !== 'usd') {
				throw exceptionMapper.mapSdkException('invalid_currency', null);
			}
		},

	checkTransactionId:
		function checkTransactionId(transactionId) {
			if (transactionId === undefined || transactionId === null || transactionId <= 0) {
				throw exceptionMapper.mapSdkException('invalid_transaction_id', null);
			}
		},

	hydrateCardManualEntry:
		function hydrateCardManualEntry(card) {
			return {
				CardNbr: card.number,
				ExpMonth: card.expMonth,
				ExpYear: card.expYear,
				CVV2: !card.cvv ? null : card.cvv.toString(),
				CardPresent: 'N',
				ReaderPresent: 'N'
			};
		},

	hydrateCardHolderData:
		function hydrateCardHolderData(cardHolder) {
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

	hydrateAuthResult:
		function hydrateAuthResult(h, b) {
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
					tokenRspCode: h.TokenData[0].TokenRspCode,
					tokenRspMsg: h.TokenData[0].TokenRspMsg,
					tokenValue: h.TokenData[0].TokenValue
				} : null
			};
		},

	serviceNameToTransactionType:
		function serviceNameToTransactionType(serviceName) {
			switch (serviceName) {
				case 'CreditAddToBatch':
					return 'Capture';
				case 'CreditSale':
					return 'Charge';
				case 'CreditReturn':
					return 'Refund';
				case 'CreditReversal':
					return 'Reverse';
				case 'creditAuth':
					return 'Authorize';
				case 'CreditAccountVerify':
					return 'Verify';
				case 'ReportActivity':
					return 'List';
				case 'ReportTxnDetail':
					return 'Get';
				case 'CreditVoid':
					return 'Void';
				case 'BatchClose':
					return 'BatchClose';
				case 'SecurityError':
					return 'SecurityError';
				default:
					return null;
			}
		},

	transactionTypeToServiceName:
		function transactionTypeToServiceName(transactionType) {
			switch (transactionType) {
				case 'Authorize':
					return 'CreditAuth';
				case 'Capture':
					return 'CreditAddToBatch';
				case 'Charge':
					return 'CreditSale';
				case 'Refund':
					return 'CreditReturn';
				case 'Reverse':
					return 'CreditReversal';
				case 'Verify':
					return 'CreditAccountVerify';
				case 'List':
					return 'ReportActivity';
				case 'Get':
					return 'ReportTxnDetail';
				case 'Void':
					return 'CreditVoid';
				case 'BatchClose':
					return 'BatchClose';
				case 'SecurityError':
					return "SecurityError";
				default:
					return '';
			}
		}
};

module.exports = Helpers;