'use strict';

var timeRegExp  		= /^[0-9]{2}:[0-9]{2}:[0-9]{2}$/,
	currRegExp  		= /^[0-9]{1,}.[0-9]{1,2}$/,
	isoDateRegExp 		= /(\d{4})-(\d{2})-(\d{2})/,
	isoDateTimeRegExp 	= /(\d{4})-(\d{2})-(\d{2})T((\d{2}):(\d{2}):(\d{2}))\.(\d{0,3})Z/;

function CustomFormats() {
	var timeFormat = 
		function timeFormat(value) {
			var values = [];

			if (timeRegExp.test(value)) {
				values = value.split(':');

				if (values[0] >= 0 && values[0] < 24 && values[1] >= 0 && values[1] < 60 && values[2] >= 0 && values[2] < 60) {
					return null;
				} else {
					return 'A valid time in 24 hour format expected';
				}
			} else {
				return 'A time in HH:MM:SS format expected';
			}
		};

	var dateFormat = 
		function dateFormat(value) {
			var values = [];

			values = value.split('-');

			if (values[0] < 3000 && values[0] > 2000 && values[1] > 0 && values[1] < 13 && values[2] > 0 && values[2] < 32) return null;

			return 'Invalid date format...';
		};

	var isoDateTimeFormat = 
		function isoDateTimeFormat(value) {
			var d, t;

			if (isoDateTimeRegExp.test(value)) {
				d = value.split('T')[0];
				t = value.split('T')[1].split('Z')[0];

				if (date(d) && time(t)) return null;
			}

			return 'Invalid ISO date time...';
		};

	var currencyFormat = 
		function currencyFormat(value) {
			value = value.toFixed(2);
			if (currRegExp.test(value)) {
				return null;
			}
			return 'A valid currency value is expected.';
		};

	var singleCharFormat =
		function singleCharFormat(value) {
			var regExp = /^[a-zA-Z]{1}$/;
			if (regExp.test(value)) {
				return null;
			}
			return 'A single character prefix is expected.';
		};

	return {
		timeFormat: timeFormat,
		dateFormat: dateFormat,
		isoDateTimeFormat: isoDateTimeFormat,
		currencyFormat: currencyFormat,
		singleCharFormat: singleCharFormat
	}
}

module.exports = CustomFormats;