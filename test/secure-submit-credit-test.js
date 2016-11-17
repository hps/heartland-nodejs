'use strict';

var fs               = require('fs'),
    config           = require('nconf'),
    assert           = require('assert'),
    util             = require('util'),
    https            = require('https'),
    HpsCreditService = require('../lib/services/secure-submit/hps-credit-service');

if (fs.statSync('./test/config.json')) {
    config.file({file: './test/config.json'});
}

function getToken(card, callback) {
  var url = 'https://cert.api2.heartlandportico.com/Hps.Exchange.PosGateway.Hpf.v1/api/token' +
            '?token_type=supt' +
            '&object=token' +
            '&_method=post' +
            '&api_key=' + config.get('validServicesConfig').publicApiKey +
            '&card%5Bnumber%5D=' + card.number +
            '&card%5Bexp_month%5D=' + card.expMonth +
            '&card%5Bexp_year%5D=' + card.expYear +
            '&card%5Bcvc%5D=' + card.cvv;

  https.get(url, function (resp) {
      var str = '';
      resp.on('data', function (data) {
          str += data;
      });

      resp.on('end', function () {
          callback(JSON.parse(str));
      });
  });
}

exports.credit_valid_config = {
    setUp: function (callback) {
        this.hpsCreditService   = new HpsCreditService(config.get('validServicesConfig'), config.get('testUri'));
        callback();
    },
    list_between_today_and_yesterday: function (done) {
        var startDate = new Date(), endDate = new Date();
        startDate.setDate(startDate.getDate() - 1);
        this.hpsCreditService.list(startDate.toISOString(), endDate.toISOString(), null, function (err, result) {
            if (err) return done(err);
            assert.notEqual(result.length, 0, 'The result should be an array with length > 0.');
            assert.equal(err, null, 'Should not return an error.');
            done();
        });
    },
    get_with_bad_id: function (done) {
        this.hpsCreditService.get(12345, function (err, result) {
            assert.equal(result, null, 'The result should be null.');
            assert.equal(err.message, 'Report criteria did not produce any results.', 'Should get the correct error message.');
            done();
        });
    },
    get_with_good_id: function (done) {
        var startDate = new Date(), endDate = new Date(), that = this;
        startDate.setDate(startDate.getDate() - 1);
        this.hpsCreditService.list(startDate.toISOString(), endDate.toISOString(), null, function (err, result) {
            that.hpsCreditService.get(Number(result[0].transactionId), function (err, result) {
                if (err) return done(err);
                assert.notEqual(result, null, 'The result should not be null.');
                done();
            });
        });
    },
    chargeWithValidVisa: function (done) {
        this.hpsCreditService.chargeWithCard(10.00, 'usd', config.get('validVisa'),
            config.get('validCardHolder'), false, null, function (err, result) {
                if (err) return done(err);
                else assert.equal(result.responseCode, '00', 'The response code should be "00".');
                done();
            });
    },
    chargeWithValidMasterCard: function (done) {
        this.hpsCreditService.chargeWithCard(10.00, 'usd', config.get('validMasterCard'),
            config.get('validCardHolder'), false, null, function (err, result) {
                if (err) return done(err);
                else assert.equal(result.responseCode, '00', 'The response code should be "00".');
                done();
            });
    },
    chargeWithValidMasterCardToken: function (done) {
        var that = this;
        getToken(config.get('validMasterCard'), function (token) {
            that.hpsCreditService.chargeWithToken(10.00, 'usd', token.token_value,
                config.get('validCardHolder'), false, null, function (err, result) {
                    if (err) return done(err);
                    else assert.equal(result.responseCode, '00', 'The response code should be "00".');
                    done();
                });
        });
    },
    authorizeWithValidMasterCard: function (done) {
        this.hpsCreditService.authorizeWithCard(10.00, 'usd', config.get('validMasterCard'),
            config.get('validCardHolder'), false, null, function (err, result) {
                assert.equal(result.responseCode, '00', 'The response code should be "00".');
                done();
            });
    },
    updateTokenExpirationWithValidToken: function (done) {
        var that = this;
        getToken(config.get('validVisa'), function (data) {
            that.hpsCreditService.verifyWithToken(data.token_value,
                config.get('validCardHolder'), true, function (err, result) {
                    assert.equal(result.responseCode, '85', 'The response code should be "85".');
                    assert.notEqual(result.tokenData, null, 'Multi-use tokenData not available.');
                    assert.notEqual(result.tokenData.tokenValue, null, 'Multi-use tokenData null.');
                    assert.notEqual(result.tokenData.tokenValue, '', 'Multi-use tokenData empty.');
                    var dDate = new Date();
                    that.hpsCreditService.updateTokenExpiration(result.tokenData.tokenValue,11, dDate.getFullYear() + 1,function (err, result) {
                        assert.equal(result.responseCode, '0', 'The response code should be "0".');
                        done();
                    });
                });
        });
    },
    updateTokenExpirationWithValidTokenInvalidMonth: function (done) {
        var that = this;
        getToken(config.get('validVisa'), function (data) {
            that.hpsCreditService.verifyWithToken(data.token_value,
                config.get('validCardHolder'), true, function (err, result) {
                    assert.equal(result.responseCode, '85', 'The response code should be "85".');
                    assert.notEqual(result.tokenData, null, 'Multi-use tokenData not available.');
                    assert.notEqual(result.tokenData.tokenValue, null, 'Multi-use tokenData null.');
                    assert.notEqual(result.tokenData.tokenValue, '', 'Multi-use tokenData empty.');
                    var dDate = new Date();
                    that.hpsCreditService.updateTokenExpiration(result.tokenData.tokenValue,21, dDate.getFullYear() + 1,function (err, result) {
                        assert.notEqual(err,null,"Expected error 'Transaction rejected because the provided data was invalid. Client requested invalid ExpMonth: 21'");
                        assert.equal(result, null, 'Unexpected Result');
                        //assert.equal(result.responseCode, '0', 'The response code should be "0".');
                        done();
                    });
                });
        });
    },
    verifyWithValidMasterCard: function (done) {
        this.hpsCreditService.verifyWithCard(config.get('validMasterCard'),
            config.get('validCardHolder'), false, function (err, result) {
                assert.equal(result.responseCode, '85', 'The response code should be "85".');
                done();
            });
    },
    verifyWithValidMasterCardToken: function (done) {
        var that = this;
        getToken(config.get('validMasterCard'), function (data) {
          that.hpsCreditService.verifyWithToken(data.token_value,
              config.get('validCardHolder'), false, function (err, result) {
                  assert.equal(result.responseCode, '85', 'The response code should be "85".');
                  done();
              });
        });
    },
    verifyWithValidMasterCardTokenGetMulti: function (done) {
        var that = this;
        getToken(config.get('validMasterCard'), function (data) {
            that.hpsCreditService.verifyWithToken(data.token_value,
                config.get('validCardHolder'), true, function (err, result) {
                    assert.equal(result.responseCode, '85', 'The response code should be "85".');
                    assert.notEqual(result.tokenData, null, 'Multi-use tokenData not available.');
                    assert.notEqual(result.tokenData.tokenValue, null, 'Multi-use tokenData null.');
                    assert.notEqual(result.tokenData.tokenValue, '', 'Multi-use tokenData empty.');
                    done();
                });
        });
    },
    capture: function (done) {
        var that = this;
        this.hpsCreditService.authorizeWithCard(10.00, 'usd', config.get('validMasterCard'),
            config.get('validCardHolder'), false, null, function (err, result) {
                assert.equal(result.responseCode, '00', 'The response code should be "00".');
                that.hpsCreditService.capture(result.transactionId, null, function (err, result) {
                    assert.equal(result.responseCode, '00', 'The response code should be "00".');
                    done();
                });
            });
    },
    refundWithValidMasterCard: function (done) {
        this.hpsCreditService.refundWithCard(10.00, 'usd', config.get('validMasterCard'),
            config.get('validCardHolder'), null, function (err, result) {
                assert.notEqual(result.transactionId, undefined, 'The response transaction ID should not be undefined.');
                done();
            });
    },
    refundWithValidTransactionId: function (done) {
        var that = this;
        this.hpsCreditService.chargeWithCard(10.00, 'usd', config.get('validVisa'),
            config.get('validCardHolder'), false, null, function (err, getResult) {
                assert.equal(getResult.responseCode, '00', 'The response code should be "00".');
                that.hpsCreditService.refundWithTransactionId(10.00, 'usd', getResult.transactionId,
                    config.get('validCardHolder'), null, function (err, refundResult) {
                        assert.notEqual(refundResult.transactionId, undefined, 'The response transaction ID should not be undefined.');
                        done();
                    });
            });
    },
    reverseWithValidTransactionIdAmountSpecified: function (done) {
        var that = this;
        this.hpsCreditService.chargeWithCard(10.00, 'usd', config.get('validVisa'),
            config.get('validCardHolder'), false, null, function (err, getResult) {
                assert.equal(getResult.responseCode, '00', 'The response code should be "00".');
                that.hpsCreditService.reverseWithTransactionId(10.00, 'usd', getResult.transactionId,
                    null, function (err, reverseResult) {
                        assert.notEqual(reverseResult.transactionId, undefined, 'The response transaction ID should not be undefined.');
                        done();
                    });
            });
    }
};

exports.credit_invalid_config = {
    setUp: function (callback) {
        this.hpsCreditService   = new HpsCreditService(config.get('invalidServicesConfig'));
        callback();
    },
    list_between_today_and_yesterday: function (done) {
        var startDate = new Date(), endDate = new Date();
        startDate.setDate(startDate.getDate() - 1);
        this.hpsCreditService.list(startDate.toISOString(), endDate.toISOString(), null, function (err, result) {
            assert.notEqual(err.message, null, 'An error should be thrown indicating an authentication problem.');
            done();
        });
    }
};
