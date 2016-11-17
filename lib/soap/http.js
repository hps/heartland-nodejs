/*
 * Copyright (c) 2013 Heartland Payment Systems
 *
 * Copyright (c) 2011 Vinay Pulim <vinay@milewise.com>
 * MIT Licensed
 */

'use strict';

var url = require('url'),
    req = require('request');

var VERSION = "0.2.0";

exports.request = function (rurl, data, callback, exheaders, exoptions) {
    var curl = url.parse(rurl),
        secure = curl.protocol === 'https:',
        host = curl.hostname,
        port = parseInt(curl.port || (secure ? 443 : 80), 10),
        path = [curl.pathname || '/', curl.search || '', curl.hash || ''].join(''),
        method = data ? "POST" : "GET",
        headers = {
            "User-Agent": "node-soap/" + VERSION,
            "Accept" : "text/html,application/xhtml+xml,application/xml",
            "Accept-Encoding": "none",
            "Accept-Charset": "utf-8",
            "Connection": "close",
            "Host" : host
        },
        attr,
        options,
        request;

    if (typeof data === 'string') {
        headers["Content-Length"] = Buffer.byteLength(data, 'utf8');
        headers["Content-Type"] = "application/x-www-form-urlencoded";
    }

    exheaders = exheaders || {};
    for (attr in exheaders) {
        if (exheaders.hasOwnProperty(attr)) {
            headers[attr] = exheaders[attr];
        }
    }

    options = {
        uri: curl,
        method: method,
        headers: headers
    };

    exoptions = exoptions || {};
    for (attr in exoptions) {
        if (exoptions.hasOwnProperty(attr)) {
            options[attr] = exoptions[attr];
        }
    }

    request = req(options, function (error, res, body) {
        //console.log('http response ' + JSON.stringify(res))
        //console.log('http response ' + body)
        if (error) {
            callback(error);
        } else {
            callback(null, res, body);
        }
    });

    request.on('error', callback);
    request.end(data);
};
