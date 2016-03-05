/**
 * @type {*|exports|module.exports}
 */

var jwt = require('jwt-simple');
var _ = require('underscore');
var phash = require('password-hash-and-salt');
var sessions = require('client-sessions');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var mongojs = require('mongojs');


var JSON_CONTENT = {'Content-Type': 'application/json; charset=utf-8'};

/**
 * Utility functions
 */

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

    // TODO KEEP
    self.secure = function(urlPattern, method, roles) {
        if (self.protectionMap[method] == undefined) {
            self.protectionMap[method] = [];
        }

        self.protectionMap[method].push({urlPattern: urlPattern, roles: roles});
    };

    // TODO KEEP BUT VERIFY
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
    //TODO VERIFY I see usage
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

    var verifyUser = function(username, password, done) {
        var collection = self.config.db.collection('users');


        collection.findOne({"login": username.toLowerCase()}, function(err, user) {
            if (err) {
                return done(null, false, { error: 'Incorrect username or password.' });
            }

            // verify the password in the hash
            phash(password).verifyAgainst(user.password, function(error, verified) {
                if (error || !verified) return done(null, false, { error: 'Incorrect username or password.' });
                return done(null, user);
            });
        });
    };

    /**
     *
     * @returns {Array} of functions to load into restify server use chain
     */
    self.initialize = function() {
        passport.serializeUser(function(user, done) {
            var id = (user['id']) ? user.id : user._id.toString();
            done(null, id);
        });

        var lookupUser = function(id, done) {
            var collection = mongodb_inst.collection('users');
            var oid = mongojs.ObjectId(id);

            collection.findOne({_id: oid}, function(err, user) {
                if (err) {
                    return done(null, false, {error: 'Incorrect username or password.'});
                }
                // verify the password in the hash
                if (user) {
                    delete user.password;
                }

                return done(null, user);
            });

        };

    // This is how a user gets deserialized
        passport.deserializeUser(lookupUser);
        var mongodb_inst = self.config.db;

    // Lookup a user in our database

        passport.use(new LocalStrategy({ usernameField: 'username', session: true }, verifyUser));


        return [
            sessions({
            // cookie name dictates the key name added to the request object
            // DONT CHANGE THIS OR IT BREAKS THE CODE
            // Changing this and res.[cookieName], does set the cooking, but the read does not process accurately
            cookieName: 'session',
            // should be a large unguessable string
            secret:  (config.session_secret) ? config.session_secret : 'adsflkjasojf',
            // how long the session will stay valid in ms
            duration: (config.session_timeout) ? config.session_timeout : 60 * 60 * 1000
            }),
            passport.initialize(),
            passport.session(),
            function(req, res, next) {
                //skip this if the user is logging in or logging out
                if (req.url.match( /\/auth\/log[in|out][\/.*]?/ )) {
                    return next();
                }

                if ((! self.requiresAuth(req.url, req.method)) || (req.isAuthenticated())) {
                    return next();
                } else {
                    // send back not logged in unauth
                    res.writeHead(401, JSON_CONTENT);
                    res.end(JSON.stringify({message: 'user not logged in'}));
                }
            }
        ];
    }

    self.createEndPoints = function(server) {
        var loginRoute = function(req, res, next) {
            // The local login strategy
            passport.authenticate('local', function(err, user, msg) {
                if (err) {
                    return next(err);
                }
                // Technically, the user should exist at this point, but if not, check
                if(!user) {
                    res.writeHead(401, JSON_CONTENT);
                    res.end(JSON.stringify({authenticated: false, message: "Not Authenticated"}));
                }
                // Log the user in!
                req.logIn(user, function(err) {
                    if (err) {
                        return next(err);
                    }
                    req.session.user_id = req.user.id;

                    var changePassword = (user.hasOwnProperty('changePassword')) ? user.changePassword : false;
                    res.json({ success: 'Welcome!', changePassword: changePassword});
                    return next();
                });

            })(req, res, next);
        };

        // acutally tries to login in
        server.post("/auth/login", loginRoute);

        /**
         * Just returns whether you are logged in or not.
         */
        server.get("/auth/login", function(req,res,next) {
            if (req.user && req.isAuthenticated()) {
                res.writeHead(200, JSON_CONTENT);
                var changePassword = (req.user.hasOwnProperty('changePassword')) ? req.user.changePassword : false;
                var rtn = {
                    authenticated: true,
                    message: 'Authenticated',
                    user: req.user};
                res.end(JSON.stringify(rtn));
            } else {
                res.writeHead(200, JSON_CONTENT);
                res.end(JSON.stringify({authenticated: false, message: "Not Authenticated"}));
            }
        });



        server.post("/auth/logout", function(req, res, next) {
            res.setCookie('session', '', {
                path: '/',
                maxAge: -3600,
                //domain: 'localhost',
                secure: false,
                httpOnly: false
            });
            res.writeHead(200, JSON_CONTENT);
            res.end(JSON.stringify({message: "logout complete"}));
        });

        server.post("/auth/forgotPassword", function(req,res,next) {
            var code = (req.body && req.body.code) ? req.body.code : null;
            var email = (req.body && req.body.username) ? req.body.username : null;

            if (code != "1401") {
                res.writeHead(401, JSON_CONTENT);
                res.end(JSON.stringify({message: "request denied"}));
                return;
            }

            try {
                var collection = self.config.db.collection('users');
                collection.findOne({"email": email.toLowerCase()}, function (err, user) {
                    if (err) {
                        res.writeHead(401, JSON_CONTENT);
                        res.end(JSON.stringify({message: "request denied"}));
                        return;
                    }
                    console.log("user found " + JSON.stringify(user.name));

                    var prCollection = self.config.db.collection('passwordReset');
                    prCollection.insert({userID: user._id, name: user.name, login: user.login, email: user.email}, function (err) {
                        if (err) {
                            console.log(err);
                            res.writeHead(500, JSON_CONTENT);
                            res.end(JSON.stringify({message: "Issue writing reset request"}));
                            return;
                        }
                        console.log("Record inserted into prCollection");

                        res.writeHead(200, JSON_CONTENT);
                        res.end(JSON.stringify({message: "request accepted"}));
                    });


                });
            } catch (exc) {
                console.log(exc);
                res.writeHead(500, JSON_CONTENT);
                res.end(JSON.stringify({message: "error"}));
            }

        });

        //TODO HERE
        /*
         var data = {currentPassword: currentPassword, newPassword: self.newPassword};

         $.ajax({
         url: "/auth/changePassword",

         */
        server.post("/auth/changePassword", function(req, res, next) {
            var currentPassword = (req.body) ? req.body.currentPassword : null;
            var newPassword = (req.body) ? req.body.newPassword : null;

            // check if the request is authenticated
            if (! req.isAuthenticated()) {
                res.writeHead(401, JSON_CONTENT);
                res.end(JSON.stringify({message: "You must be logged in to change your password."}));
                return;
            }

            //TODO  add password complexity here
            verifyUser(req.user.login, currentPassword, function(err, user) {
                if (err) {
                    res.writeHead(401, JSON_CONTENT);
                    res.end(JSON.stringify({message: "Either not authenticated or your current password is wrong."}));
                    return;
                }
                // update the user hashing in the new password
                //TODO  This type of code is done in forgotpwdjob seems redundant and should be a helper function
                phash(newPassword).hash(function (err, hashedpassword){
                    if (err) {
                        res.writeHead(500, JSON_CONTENT);
                        res.end(JSON.stringify({message: "Unable to create the new password."}));
                        return;
                    }
                    user.password = hashedpassword;
                    var userCollection = self.config.db.collection('users');
                    userCollection.update({_id: user._id}, user, {multi: false}, function (err, data) {
                        console.log("updating user " + user.name.fullName + ' to ' + newPassword );
                        if (err) {
                            res.writeHead(500, JSON_CONTENT);
                            res.end(JSON.stringify({message: "Unable to update the new password."}));
                        } else {
                            res.writeHead(200, JSON_CONTENT);
                            res.end(JSON.stringify({message: "Password successfully updated."}));
                        }
                    });
                });
            });
        });

    };




}





module.exports = Auth;