var jwt = require('jwt-simple');
var async = require('async');
var _ = require('underscore');

var JSON_CONTENT = {'Content-Type': 'application/json; charset=utf-8'};

/**
 * Utility functions
 */
function expiresIn(numDays) {
    var dateObj = new Date();
    return dateObj.setDate(dateObj.getDate() + numDays);
}
function fetchRoles(authMap, method, url) {
    var ary = authMap[method];
    if (ary == undefined) {
        return [];
    }

    for (var i = 0; i < ary.length; i++) {
        if (url.match(ary[i].urlPattern)) {
            return ary[i].roles;
        }
    }

    return [];
}

function getRequestToken(req) {
    var etoken = (req.body && req.body.access_token) || (req.query && req.query.access_token) || req.headers['x-access-token'];
    var token = null;

    if (!etoken) {
        etoken = req.cookies['token'];
    }

    try {
        token = jwt.decode(etoken, require('./secret.js')(),false,'HS512');
        // check the expiry
        if (token.exp < Date.now()) {
            token = null;
        }
    } catch(err) {
        console.log("error with token " + err);
        console.log(token);
        console.log(typeof token);
    }
    return token;
}


/**
 * Authentication module used for authenticating rest end points
 *   config:
 *      db -> for now mongo db reference that is used to look up the credentials, should be abstracted REFACTOR
 *      protectionMap -> list of url patterns to check if protected.  uses verbal expressions
 *      tokenMap -> list of tokens for tracking logins, should probably be cached
 *
 *  TODO
 *     add node-cache for tokenMap caching
 *     right now no need, since the token itself is hashed and keeps the exiration date, so it can persist on the browser
 *       during restarts.  If we care about spoofing, then we can keep a local copy as well.
 */

function Auth(config) {
    var self = this;
    self.config = config;
    self.protectionMap = {};
    //this.tokenMap = new NodeCache({stdTTL: 1800, checkperiod: 600});

    self.genToken = function(user, numDays) {
        var expires = expiresIn(numDays);

        var token = jwt.encode({
            exp: expires,
            user: user.login,
            roles: (_.isArray(user.roles) ? user.roles : [ user.roles ])
        }, require('./secret.js')(), 'HS512');

        return {token: token, expires: expires, user: user.login};
    };
    self.isValidToken = function(token) {
        var valid = false;
        try {
            var dtoken = jwt.decode(token, require('./secret.js')(),false,'HS512');
            // check the expiry
            if (dtoken.exp < Date.now()) {
                return false;
            }
            valid = true;
        } catch(err) {
            console.log("error with token " + err);
            console.log(token);
            console.log(typeof token);
        }

        return valid;
    };

    self.login = function(params) {
        var EXPIRE_NUM_DAYS = 7; // should be a config option
        var req = params.request;
        var collection = params.collection;
        var login = req.params.login || req.body.login || ""; // change this to login
        var password = req.params.password || req.body.password || "";

        collection.findOne({"login": login}, function(err, user) {
            if (user && user.password && (user.password == password)) {
                if (params.success) {
                    params.success(self.genToken(user, EXPIRE_NUM_DAYS));
                }
            } else {
                if (params.failure) {
                    params.failure();
                }
            }
        });
    };

    self.secure = function(urlPattern, method, roles) {
        if (self.protectionMap[method] == undefined) {
            self.protectionMap[method] = [];
        }

        self.protectionMap[method].push({urlPattern: urlPattern, roles: roles});
    };

    self.validateRequest = function(request) {
        var url = request.url;
        var method = request.method;
        var valid = true;

        // do I need to have a specific role for to access this endpoint?
        var roles = fetchRoles(self.protectionMap, method, url);
        if (roles.length > 0) {
            var token = getRequestToken(request);
            if (token) {
                // check that a role exists in both
                var x = _.intersection(roles, token.roles);

                valid = (x && x.length > 0);
            } else {
                valid = false;
            }
        }
        return valid;
    };

    //@deprecate
    self.requiresAuth = function(url, method) {
        var ary = self.protectionMap[method];
        if (ary == undefined) {
            return false;
        }

        for (var i = 0; i < ary.length; i++) {
            if (url.match(ary[i].urlPattern)) {
                return true;
            }
        }

        return false;
    };

    self.isLoggedIn = function(req) {
        var token = getRequestToken(req);
        console.log("isLoggIn called")

        return (token != undefined );
    };

    self.createEndPoints = function(server, basePath, loginCollection) {
        server.get("/auth/login", function(req, res, next) {
            if (self.isLoggedIn(req)) {
                res.writeHead(200, JSON_CONTENT);
                res.end(JSON.stringify({authenticated: true, message: "Authenticated"}));
            } else {
                res.writeHead(200, JSON_CONTENT);
                res.end(JSON.stringify({authenticated: false, message: "Not Authenticated"}));
            }
        });
        server.post("/auth/logout", function(req, res, next) {
            res.setCookie('token', '', {
                path: '/',
                maxAge: -3600,
                //domain: 'localhost',
                secure: false,
                httpOnly: false
            });
            res.writeHead(200, JSON_CONTENT);
            res.end(JSON.stringify({message: "logout complete"}));
        });
        server.post("/auth/login", function(req, res, next) {
            console.log("login post called");
            auth.login({
                request: req,
                collection: loginCollection,
                success: function(results) {
                    // set a cookie as well

                    res.setCookie('token', results.token, {
                        path: '/',
                        maxAge: 3600,
                        // domain: 'localhost',
                        secure: false,
                        httpOnly: false
                    });

                    res.writeHead(200, JSON_CONTENT);
                    res.end(JSON.stringify(results));
                    return next();
                },
                failure: function() {
                    res.writeHead(401, JSON_CONTENT);
                    res.end(JSON.stringify({message: 'Not Authorized'}));
                    return next();
                }

            });
        });
    };

    self.restifyPlugin = function(req, res, next) {
        //skip this if the user is logging in or logging out
        if (req.url.match( /\/auth\/log[in|out][\/.*]?/ )) {
            return next();
        }

        //if ((! auth.requiresAuth(req.url, req.method)) || auth.isLoggedIn(req)) {
        //todo if cookie is here, then rest the cookie, so it is passed back.
        if (self.validateRequest(req)) {

            return next();
        } else {
            // send back not logged in unauth
            res.writeHead(401, JSON_CONTENT);
            res.end(JSON.stringify({message: 'user not logged in'}));
        }
    };

}





module.exports = Auth;