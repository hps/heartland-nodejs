'use strict';

module.exports = {
    // SecureSubmit Services...
    HpsCreditService: require('./lib/services/secure-submit/hps-credit-service'),
    HpsBatchService: require('./lib/services/secure-submit/hps-batch-service'),
    // Portico Services...
    PorticoReport: require('./lib/services/portico-services/report-service'),
    // Enumalte namespaces from other SDKs
    Infrastructure: {
        Enums: require('./lib/infrastructure/enums')
    }
};
