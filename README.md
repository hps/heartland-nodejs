## Hps

This node.js SDK makes it easy to process payments against the Heartland Payment Systems Portico Gateway.

## Installation

to be populated

## Usage

```
var SecureSubmit = require('heartand-node').SecureSubmit,
	config = {
		        secretApiKey: 	'skapi_cert_MTyMAQBiHVEAewvIzXVFcmUd2UcyBge_eCpaASUp0A',
		        publicApiKey: 	'pkapi_cert_jKc1FtuyAydZhZfbB3',
		        versionNumber: 	'1234',
		        developerId: 	'123456',
		        siteTrace: 		'trace0001'
		    },
    uri = 'https://cert.api2.heartlandportico.com/Hps.Exchange.PosGateway/PosGatewayService.asmx';
    secureSubmit = new SecureSubmit(config, uri);

secureSubmit.chargeWithCard(amount, currency, card, cardHolder, requestMultiUseToken, memo, callback);
```


Supported Gateway Calls

CreditAccountVerify (4.3)
CreditAddToBatch (4.4)
CreditAuth (4.5)
CreditReturn (4.9)
CreditReversal (4.10)
CreditSale (4.11) 
ReportActivity (10.4)
ReportTxnDetail (10.8)
BatchClose (10.3)

## Contributing

1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request