
var assert = require("assert");
//var should = require("should");
var jsv = require("../json-schema-validator");

var validator = new jsv();

describe ('json-schema-validator', function() {
   describe ('#validateStringInput()', function() {
      it('should return true if Dale is not empty', function() {
         assert.equal(true, validator.isRequired('Dale', true));
      });
      it('should return true if Dale is a string', function() {
         assert.equal(true, validator.isString('Dale', true));
      });
   });

   describe('#validateDateInput()', function() {
      it('should return true if 2014-01-01 is a date', function() {
         assert.equal(true, validator.isDate('2014-01-01', true));
      });
      it('should not return true because 201x-01-01 is not a date', function() {
         assert.equal(false, validator.isDate('201x-01-01', true));
      });
      it('should return true because null is a validate date', function() {
         assert.equal(true, validator.isDate(null, true));
      });
   });

   describe ('#validateTimeInput()', function() {
      it('should return true if 0800 is a time', function() {
         assert.equal(true, validator.isTime('0800', true));
      });
      it('should not return true because x0800 is not a time', function() {
         assert.equal(false, validator.isTime('x0800', true));
      });
      it('should return true because null is a validate time', function() {
         assert.equal(true, validator.isTime(null, true));
      });
   });

   describe ('#isOneOf()', function() {
      it('should return true if red is one of the list', function() {
         assert.equal(true, validator.isOneOf('red', ['red', 'orange', 'blue']));
      });
   });

   describe ('#pointsTo()', function() {
      it('should return true if this is a valid URI pointing to an object', function() {
         assert.equal(true, validator.pointsTo('https://somedomain.com/rest/vx/location/5416ed1df853ab98040aa8a9', 'location'));
      });
      it('should return false because the items do not match', function() {
         assert.equal(false, validator.pointsTo('https://somedomain/rest/vx/person/5416ed1df853ab98040aa8a9', 'location'));
      });
      it('should return true because the items points to a valid url', function() {
         assert.equal(true, validator.pointsTo('http://192.168.56.101/rest/v1/locations/5443341f746174f505e2e67b', 'locations'));
      });
   });

   describe ('#checkField()', function() {
     var scheduleTime = {date: {isDate: true}
                        ,start_time: {isTime: true}
                        ,end_time: {isTime: true}};

     it('should return [] if is valid', function() {
        assert.equal(true, validator.checkField('date', {isDate: true}, '2014-01-01'));
     });
     it('should return 1 error', function() {
        assert.equal(false, validator.checkField('date', {isDate: true}, '2014-x1-01'));
     });

   });

   describe('#checkInput(empty)', function() {
     var data = {};
     var schema = {};
     it('should return true checking empty data and schema', function() {
        assert.equal(true, validator.validateInput(data, schema));
     });
   });

   describe('#checkInput()', function() {
     var schema = {name: {isString: true, isRequired: true}
              ,event_type: {isString: true, isRequired: true}
              };

     var data = {name: 'Some Event', event_type: 'SHOOT'};
     it('should return true if the data is valid based on the schema', function() {
        assert.equal(true, validator.validateInput(data, schema));
     });
      
   });

   describe('#checkInput(complex)', function() {
     var addressSchema = {street: {isRequired:true, isString:true}
                         ,city: {isRequired:true, isString:true}
                         ,state: {isRequired:true, isString:true}
                         ,zipCode: {isRequired:true, isString:true}};


     var schema = {name: {isString: true, isRequired: true}
              ,address: {isArrayOf: [addressSchema, 1]}
              };

     var data = {name: 'Home'
                ,address: [{street:'1621 Fairport Dr.'
                           ,city: 'Grayslake', state: 'IL', zipCode: '60030'}]};
     it('should succeed if the address data is valid', function() {
        assert.equal(true, validator.validateInput(data, schema));
     });

     var data2 = {name: 'will fail', address: []};
     it('should fail because the array is empty', function() {
        assert.equal(false, validator.validateInput(data2, schema));
        assert.deepEqual([{field: "date", message:"date failed isDate check"}
                          ,{field: "address", message: "address failed isArrayOf check"}], validator.getFieldErrors());
     });

     var schema2 = {name: {isString: true, isRequired: true}
              ,address: {isArrayOf: [addressSchema, 0]}
              };
     it('should pass because there is no min count on the array', function() {
        assert.equal(true, validator.validateInput(data2, schema2));
     });

     var schema3 = {link: {pointsTo: 'somewhere'}};
     var data3 = {link: 'http://localhost/rest/v2/somewhere/aldf09fads'};
     it('should check the schema for a valid rest link', function() {
        assert.equal(true, validator.validateInput(data3, schema3));
     });
   });

  describe('isObject()', function() {
     var s = {name: {firstName: {isRequired:true}, lastName: {isRequired:true}, fullName: {isRequired:false}}};
     var d = {name: {firstName: "Dale", lastName: "Steeber", fullName: "Dale Steeber"}};
     it('should pass if the name is valid object', function() {
         assert.equal(true, validator.isObject(d, s));
     });
  });

});
