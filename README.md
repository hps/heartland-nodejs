## Hps

This node.js SDK makes it easy to process payments against the Heartland Payment Systems Portico Gateway.

## Installation

`npm install heartland-node`

## Usage

```
var heartland = require('heartand-node'),
	config = {
		        secretApiKey: 	'skapi_cert_MTyMAQBiHVEAewvIzXVFcmUd2UcyBge_eCpaASUp0A',
		        publicApiKey: 	'pkapi_cert_jKc1FtuyAydZhZfbB3',
		        versionNumber: 	'1234',
		        developerId: 	'123456',
		        siteTrace: 		'trace0001'
		    },
    uri = 'https://cert.api2.heartlandportico.com/Hps.Exchange.PosGateway/PosGatewayService.asmx';
    secureSubmit = new heartland.SecureSubmit(config, uri),
    porticoReport = new heartland.PorticoReport(config, uri);

secureSubmit.chargeWithCard(amount, currency, card, cardHolder, requestMultiUseToken, memo, callback);
porticoReport.reportTxnDetail(transactionId, callback);
```


### Implemented Package Functions

#### SecureSubmit

* chargeWithCard
* chargeWithToken
* authorizeWithCard
* authorizeWithToken
* verifyWithCard
* verifyWithToken
* capture
* refundWithCard
* refundWithTransactionId
* reverseWithCard
* reverseWithTransactionId
* closeBatch
* get
* list

#### PorticoReport

* reportBatchDetail
* reportBatchHistory
* reportBatchSummary
* reportOpenAuths
* reportTxnDetail

## Contributing

1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request