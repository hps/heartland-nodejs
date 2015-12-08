'use strict';

var path            = require('path'),
    soap            = require('../soap'),
    exceptionMapper = require('../infrastructure/exception-mapper');

function PorticoGateway(hpsConfig, soapUri) {
    
    var self = this, client,
        config = hpsConfig,
        endPoint = soapUri || 'https://cert.api2.heartlandportico.com/Hps.Exchange.PosGateway/PosGatewayService.asmx',
        wsdl = path.resolve(__dirname,'../../wsdl/cert.wsdl');

    var submitTransaction = 
        function submitTransaction(transaction, callback) {
            var req = {
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
                    client.DoTransaction(req, function (err, gatewayResult) {
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

    return {
        submitTransaction: submitTransaction
    };
};


module.exports = PorticoGateway;