'use strict';

var soap = require('../soap'),
    wsdl = './wsdl/cert.wsdl',
    endPoint = 'https://cert.api2.heartlandportico.com/Hps.Exchange.PosGateway/PosGatewayService.asmx',
    client,
    config,
    HpsService = function (hpsServicesConfig, soapUri) {
        config = hpsServicesConfig;
        endPoint = soapUri || endPoint;
    },
    exceptionMapper = require('../infrastructure/exception-mapper');

HpsService.prototype.submitTransaction = function (transaction, callback) {
    var posRequest = {
        'Ver1.0': {
            Header: {
                SecretAPIKey : config.secretApiKey,
                VersionNbr: config.versionNumber,
                DeveloperID: config.developerId,
                SiteTrace: config.siteTrace
            },
            Transaction: transaction
        }
    };

    function clientReady(err, c) {
        if (err) {
            callback(err, undefined);
        } else {
            if (!client) { client = c; }
            client.DoTransaction(posRequest, function (err, gatewayResult) {
                if (err) {
                    callback(err, null);
                } else if (gatewayResult) {
                    var h = gatewayResult['Ver1.0'][0].Header[0];
                    if (h.GatewayRspCode === 0) {
                        callback(null, {header: h, body: gatewayResult['Ver1.0'][0].Transaction[0]});
                    } else {
                        callback(exceptionMapper.mapGatewayException(h.GatewayTxnId, h.GatewayRspCode, h.GatewayRspMsg[0]), null);
                    }
                } else {
                    callback(new Error('The gateway failed to respond with any data.'), null);
                }
            });
        }
    }

    if (!client) {
        soap.createClient(wsdl, clientReady, endPoint);
    } else {
        clientReady(undefined, client);
    }
};

HpsService.prototype.serviceNameToTransactionType = function (serviceName) {
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
};

HpsService.prototype.transactionTypeToServiceName = function (transactionType) {
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
};

exports.HpsService = HpsService;
