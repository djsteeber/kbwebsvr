var assert = require("assert");
var Auth = require("../auth");
var VerEx = require('verbal-expressions');


describe ('auth', function() {
    var auth;
    var db = {};
    before(function() {
        auth = new Auth({});

        db.findOne = function (item, fn) {
            if (item && item.login) {
                var rtn = item;
                rtn.password = "pwd";
                return fn(false, rtn);
            } else {
                return fn(true, null);
            }
        };

        var pattern = VerEx().startOfLine().then('/rest/endpoint').maybe('/').endOfLine();
        auth.secure(pattern, 'GET');

    });
    after(function() {
        auth = undefined;
        db = {};
    });

    describe('#requiresAuth()', function () {
        it('unsecure endpoint', function() {
            assert.equal(false, auth.requiresAuth("/rest", 'GET'));
        });
        it('should return true', function () {
            assert.equal(true, auth.requiresAuth("/rest/endpoint", 'GET'));
        });
        it('should return false', function () {
            assert.equal(false, auth.requiresAuth("/rest/endpoint", 'POST'));
        });
    });
    describe('.genToken', function() {
        var token = '';
        context('any time', function() {
            it('should be different', function() {
                var token = auth.genToken(12, 5);
                assert.notEqual(auth.genToken(12, 5), auth.genToken(1123214, 5));
            });
            it('should be valid', function() {
                var token = auth.genToken(12, 5);
                assert.equal(true, auth.isValidToken(token.token));
            });
            it('should be invalid', function() {
                var token = auth.genToken(12, -5);
                assert.equal(false, auth.isValidToken(token.token));
            });
        });
    });
    describe('.login', function() {
        context('any time', function() {
            it('should fail with no user', function() {
                var result = auth.login({params: {login: '', password: ''}, body: {} }, db);
                assert.equal(false, result.success);
            });
        });
    });
    describe.skip('.isLoggedIn', function() {
        context('never logged in', function() {
            it('should fail with any user', function() {
                var req = {params: {},
                    headers: {'x-access-token': ''}
                };
                assert.equal(false, auth.isLoggedIn(req));
            });
        });
        context('after logged in', function() {
            it('should succeed with user', function() {
                var req = {};
                var result = auth.login({params: {login: 'test', password: 'pwd'}, body: {} }, db);
                assert.equal(true, result.success);
                assert.notEqual("", result.token);
                assert.notEqual("", result.token.token);

                req = {params: {},
                       headers: {'x-access-token': result.token.token}
                      };

                assert.equal(true, auth.isLoggedIn(req));

            });
        });

    });


});
