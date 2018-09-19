'use strict';

var _               = require('lodash'),
    path            = require('path'),
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
                        SecretAPIKey : _.trim(config.secretApiKey),
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
                    return;
                }

                if (!client) { client = c; }
                client.DoTransaction(req, function (err, gatewayResult) {
                    if (err) {
                        callback(err, null);
                        return;
                    }

                    if (!gatewayResult) {
                        callback(new Error('The gateway failed to respond with any data.'), null);
                        return;
                    }

                    if (!gatewayResult['Ver1.0'] || !gatewayResult['Ver1.0'][0]) {
                        callback(new Error('An unexpected response was recevied.'), null);
                        return;
                    }

                    var version1 = gatewayResult['Ver1.0'][0];
                    var header = version1.Header[0];

                    if (header.GatewayRspCode !== 0) {
                        callback(
                            exceptionMapper.mapGatewayException(
                                header.GatewayTxnId,
                                header.GatewayRspCode,
                                header.GatewayRspMsg[0]
                            ),
                            null
                        );
                        return;
                    }

                    var body = null;
                    if (version1.Transaction && version1.Transaction[0]) {
                        body = version1.Transaction[0];
                    }

                    callback(null, {header: header, body: body});
                });
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
}


module.exports = PorticoGateway;
