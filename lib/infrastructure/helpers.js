'use strict';

function isNumeric(target) {
    return !isNaN(parseFloat(target)) && isFinite(target);
};

function objProp(o, p) {
    return Object.prototype.hasOwnProperty.call(o,p) && o[p] !== undefined && o[p] !== null;
};

function defNn(v) {
    return v !== undefined && v !== null;
};

var Helpers = {

        isNumeric: isNumeric,

        objProp: objProp,

        defNn: defNn,

        hydrateCardData:
            function hydrateCardData(obj) {
                var result = {};

                if (obj) {
                    if (objProp(obj,'number'))          { result.CardNbr = obj.number; }
                    if (objProp(obj,'expMonth'))        { result.ExpMonth = obj.expMonth; }
                    if (objProp(obj,'expYear'))         { result.ExpYear = obj.expYear; }
                    if (objProp(obj,'cvv'))             { result.CVV2 = obj.cvv.toString(); }
                    if (objProp(obj,'cardPresent'))     { result.CardPresent = obj.cardPresent ? 'Y': 'N'; } else { result.CardPresent = 'N'; }
                    if (objProp(obj,'readerPresent'))   { result.ReaderPresent = obj.readerPresent ? 'Y': 'N'; } else { result.ReaderPresent = 'N'; }
                    if (objProp(obj,'token'))           { result.TokenValue = obj.token; }
                    
                    return result;
                }

                return undefined;
            },

        hydrateCardHolderData:
            function hydrateCardHolderData(cardHolder) {
                var result = {};

                if (cardHolder) {
                    if (objProp(cardHolder,'firstName'))    { result.CardHolderFirstName = cardHolder.firstName; }
                    if (objProp(cardHolder,'lastName'))     { result.CardHolderLastName = cardHolder.lastName; }
                    if (objProp(cardHolder,'email'))        { result.CardHolderEmail = cardHolder.email; }
                    if (objProp(cardHolder,'phone'))        { result.CardHolderPhone = cardHolder.phone; }
                    if (objProp(cardHolder,'address')) {
                        if (objProp(cardHolder.address,'address'))  { result.CardHolderAddr = cardHolder.address.address; }
                        if (objProp(cardHolder.address,'city'))     { result.CardHolderCity = cardHolder.address.city; }
                        if (objProp(cardHolder.address,'state'))    { result.CardHolderState = cardHolder.address.state; }
                        if (objProp(cardHolder.address,'zip'))      { result.CardHolderZip = cardHolder.address.zip; }
                    }

                    return result;
                }

                return undefined;
            },

        hydrateAuthResult:
            function hydrateAuthResult(h, b) {
                return {
                    transactionId:      h.GatewayTxnId,
                    authorizationCode:  b.AuthCode,
                    avsResultCode:      b.AVSRsltCode,
                    avsResultText:      b.AVSRsltText,
                    cardType:           b.CardType,
                    cpcIndicator:       b.CPCInd,
                    cvvResultCode:      b.CVVRsltCode,
                    cvvResultText:      b.CVVRsltText,
                    referenceNumber:    b.RefNbr,
                    responseCode:       b.RspCode,
                    responseText:       b.RspText,
                    tokenData:          h.TokenData ? {
                                            tokenRspCode:   h.TokenData[0].TokenRspCode,
                                            tokenRspMsg:    h.TokenData[0].TokenRspMsg,
                                            tokenValue:     h.TokenData[0].TokenValue
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