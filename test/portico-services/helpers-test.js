'use strict';

var assert   = require('assert'),
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
    assert.equal(rc,true,'\'\' should return true');
  },

  onString: function(){
    var rc = helpers.isEmptyObject(' ');
    assert.equal(rc,true,'\' \' should return true');
  },

  onNotEmpty: function(){
    var rc = helpers.isEmptyObject({x:0});
    assert.equal(rc,false,'{x:0} should return false');
  }
};
