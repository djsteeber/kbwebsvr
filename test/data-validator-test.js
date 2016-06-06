
var assert = require("assert");
//var should = require("should");
var DataValidator = require("../data-validator");
var dataValidator = new DataValidator();

describe ('data-validator', function() {

    describe ('#notEmpty()', function() {
        it('should return true if value is not empty', function() {
            assert.equal(true, dataValidator.notEmpty('asdf'));
        });
        it('should return false if value is null', function() {
            assert.equal(false, dataValidator.notEmpty(null));
        });
        it('should return false if value is empty string', function() {
            assert.equal(false, dataValidator.notEmpty(''));
        });
        it ('should return true if the value is a number', function() {
           assert.equal(true, dataValidator.notEmpty(12));
        });
    });

    describe('#email()', function() {
        it('should return true if the email is valid', function() {
            assert.equal((true, dataValidator.email('djsteeber@yahoo.com')));
        });
        it('should return false if the email is valid', function() {
            assert.equal((false, dataValidator.email('djsteeberyahoo.com')));
        });
    });

    describe('#phoneNumber()', function() {
       it('should return who knows for phone number', function() {
           assert.equal(true, dataValidator.phoneNumber('(312)479-8495'));
           assert.equal(true, dataValidator.phoneNumber('(312) 479-8495'));
           assert.equal(true, dataValidator.phoneNumber('1(312) 479-8495'));
       })
    });

});
