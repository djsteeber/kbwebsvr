var jwt = require('jwt-simple');
var async = require('async');
var _ = require('underscore');

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
    this.config = config;
    this.protectionMap = {};
    //this.tokenMap = new NodeCache({stdTTL: 1800, checkperiod: 600});

}

function expiresIn(numDays) {
    var dateObj = new Date();
    return dateObj.setDate(dateObj.getDate() + numDays);
}

Auth.prototype.genToken = function(user, numDays) {
    var expires = expiresIn(numDays);

    var token = jwt.encode({
        exp: expires,
        user: user.login,
        roles: (_.isArray(user.roles) ? user.roles : [ user.roles ])
    }, require('./secret.js')(), 'HS512');

    return {token: token, expires: expires, user: user.login};
};

/**
 *
 * @param token jwt token string
 */
Auth.prototype.isValidToken = function(token) {
    var valid = false;
    try {
        var dtoken = jwt.decode(token, require('./secret.js')(),false,'HS512');
        // check the expiry
        if (dtoken.exp < Date.now()) {
            return false;
        }
        valid = true;
    } catch(err) {
//        console.log("error with token " + err);
//        console.log(token);
//        console.log(typeof token);
    }

    return valid;

};
/**
 *  @param params hash of req, collection, success(), failure()
 * returns a token hash
 */
Auth.prototype.login = function(params) {
    var EXPIRE_NUM_DAYS = 7; // should be a config option
    var req = params.request;
    var collection = params.collection;
    var login = req.params.login || req.body.login; // change this to login
    var password = req.params.password || req.body.password;

    var that = this;
    collection.findOne({"login": login}, function(err, user) {
        if (user && user.password && (user.password == password)) {
            if (params.success) {
                params.success(that.genToken(user, EXPIRE_NUM_DAYS));
            }
        } else {
            if (params.failure) {
                params.failure();
            }
        }
    });
};


Auth.prototype.secure = function(urlPattern, method, roles) {
    if (this.protectionMap[method] == undefined) {
        this.protectionMap[method] = [];
    }

    this.protectionMap[method].push({urlPattern: urlPattern, roles: roles});
};

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
//        console.log("error with token " + err);
//        console.log(token);
//        console.log(typeof token);
    }
    return token;
};

Auth.prototype.validateRequest = function(request) {
    var url = request.url;
    var method = request.method;
    var valid = true;

    // do I need to have a specific role for to access this endpoint?
    var roles = fetchRoles(this.protectionMap, method, url);
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
Auth.prototype.requiresAuth = function(url, method) {
    var ary = this.protectionMap[method];
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



// check the request and see if the user has the authority to access
// also check to see if the user is logged in
Auth.prototype.isLoggedIn = function(req) {
    var token = (req.body && req.body.access_token) || (req.query && req.query.access_token) || req.headers['x-access-token'];

    return this.isValidToken(token);
};



module.exports = Auth;