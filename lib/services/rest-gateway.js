'use strict';

var _     = require('lodash'),
    https = require('https'),
    url   = require('url');

function RestGateway(config, enableLogging) {

    var _self = this,
        _config = config,
        _logging = enableLogging,
        _limit,
        _offset,
        _searchFields;

    var page = function (limit, offset) {
        _limit = limit;
        _offset = offset;

        return _self;
    };

    var search = function (searchFields) {
        _searchFields = searchFields;

        return _self;
    };

    var clean = function () {
        _limit = null;
        _offset = null;
        _searchFields = null;
    };

    var doRequest = function(verb, endpoint, data, additionalHeaders, callback) {
        var serviceUri = url.parse(_config.serviceUri);
        var options = {
            host: serviceUri.host,
            path: serviceUri.path + endpoint,
            // host: 'localhost',
            // port: '9999',
            // path: '/index.php' + endpoint,
            method: verb.toUpperCase(),
            headers: _.assign({'content-type': 'application/json; charset=utf-8'}, additionalHeaders)
        };

        options.path = options.path + (_limit ? '?limit=' + _limit : '');
        options.path = options.path + (_offset ? (_limit ? '&' : '?') + 'offset=' + _offset : '');

        // Authentication
        if (_config.secretApiKey) {
            options.headers['Authorization'] = 'Basic ' + new Buffer(_config.secretApiKey).toString('base64');
        } else if (_config.username && _config.password) {
            options.auth = {user: _config.username, password: _config.password};
        }

        // Additional Headers
        data && (options.headers['Content-Length'] = JSON.stringify(data).length.toString());

        if (data && _logging) { console.log('Request: ');console.log(data); }
        if (_logging) { console.log('Options: ');console.log(options); }

        var req = https.request(options, function (res) {
            var result = '';

            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                result += chunk;
            });

            res.on('end', function () {
                var err;
                if (_logging) {
                    console.log('Response data: ');
                    console.log(result);
                }
                try {
                    result = result && JSON.parse(result);
                } catch (e) {
                    err = new Error('Bad JSON in response.');
                    err.statusCode = res.statusCode;
                    clean();
                    callback(err, null);
                    return;
                }

                clean();

                if (res.statusCode === 200 || res.statusCode === 204) {
                    if (_.isFunction(callback)) {
                        callback(null, result);
                    }
                } else if (res.statusCode === 400) {
                    var message = result.error ? result.error.message : '';
                    err = new Error(message);
                    err.statusCode = 400;
                    callback(err, null);
                } else {
                    err = new Error('Unexpected response.' + JSON.stringify(result));
                    err.statusCode = res.statusCode;
                    callback(err, null);
                }
            });
        })
        .on('error', function (e) {
            // handle PayPlan's weird response on DELETE requests
            if ('DELETE' === verb.toUpperCase() && 'HPE_INVALID_CONSTANT' === e.code) {
                return;
            }
            if (_logging) {
                console.log('problem with HPS request: ' + e.message);
                console.log(JSON.stringify(e));
            }
            clean();
            callback(new Error(e.message), null);
        });

        if (data) { req.write(JSON.stringify(data)); }
        req.end();

        return _self;
    };

    return {
        page: page,
        search: search,
        doRequest: doRequest
    };
}

module.exports = RestGateway;
