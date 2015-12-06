'use strict';

var fs                  = require('fs'),
	config              = require('nconf'),
	util                = require('util'),
	PorticoGateway      = require('../lib/infra/portico-gateway'),
	PorticoReport 		= require('../lib/services/portico-report');

if (fs.statSync('./test/config.json')) {

	config.file({file: './test/config.json'});

	var porticoGateway 		= new PorticoGateway(config.get('validServicesConfig'), config.get('testUri')),
		porticoReport 		= new PorticoReport(porticoGateway),
		startDate 			= new Date(),
		endDate 			= new Date();
	
	startDate.setDate(startDate.getDate() - 3);
	endDate.setDate(endDate.getDate() - 2);
	
	porticoReport.reportBatchHistory(startDate, endDate.toISOString(), null, null, function (err, result) {
		if (err) return console.log(err);
		if (result) {
			console.log(util.inspect(result, {showHidden: false, depth: null}));
		}
	});
};