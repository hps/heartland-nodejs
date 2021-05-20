'use strict';

var assert   = require('assert'),
    schema   = require('../../lib/infrastructure/validation/portico-schema'),
    helpers  = require('../../lib/infrastructure/helpers');

exports.isEmptyObject = {
  onNull: function () {
    var rc = helpers.isEmptyObject(null);
    assert.equal(rc,true,'null should return true');
  },

  onEmpty: function(){
    var rc = helpers.isEmptyObject({});
    assert.equal(rc,true,'{} should return true');
  },

  onNotObject: function() {
    var rc = helpers.isEmptyObject('');
    assert.equal(rc,false,'\'\' should return false');
  },

  onString: function(){
    var rc = helpers.isEmptyObject(' ');
    assert.equal(rc,false,'\' \' should return false');
  },

  onNotEmpty: function(){
    var rc = helpers.isEmptyObject({x:0});
    assert.equal(rc,false,'{x:0} should return false');
  }
};

exports.validateRequestTypes = {
  validObjects: function(){
    requestTypes.map(rt=>{
      var rc = schema.requestType(rt);
      assert.equal(helpers.isEmptyObject(rc),false, rt + ' should be a valid type');
      assert.equal(isRequestObject(rc),true, rt + ' should be a valid request object');
    });
  },
  validTransactions: function(){
    requestTypes.map(rt=>{
      var rc = helpers.serviceNameToTransactionType(rt);
      assert.notEqual(rc,null, rt + ' should have a Transaction Type');
    });
  },

  validServiceNames: function(){
    requestTypes.map(rt=>{
      var rc = helpers.serviceNameToTransactionType(rt);
      var rc2 = helpers.transactionTypeToServiceName(rc);
      assert.notEqual(rc2,null,rt + ' should be a valid Service Name');
      assert.equal(rt,rc2, rt + ' should be the same as ' + rc2);
    });
  }
};

function isRequestObject(o){
  var rc = false;
  if (!helpers.isEmptyObject(o)){
    if (o.type==='object'&&!helpers.isEmptyObject(o.properties)){
      rc = true;
    }
  }
  return rc;
}

var requestTypes = [
  'CreditSale',
  'CreditAuth',
  'CreditAccountVerify',
  'CreditAddToBatch',
  'CreditReturn',
  'CreditReversal',
  'ReportActivity',
  'ReportBatchDetail',
  'ReportBatchHistory',
  'ReportBatchSummary',
  //'ReportOpenAuths',
  'ReportTxnDetail',
  'ManageTokens'
]