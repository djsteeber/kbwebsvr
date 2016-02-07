//TODO, need to rip out framework of auth
// for now it is just using the function to determine if a rest endpoint is needed
// to be secure


// This environment veriable is needed for the session secret key
// if it is not set the system will err KBWEBSVR_SECRET_KEY


var restify = require('restify');
var fs = require('fs');
var mongojs = require('mongojs');
var rmep = require('./restify-mep');
var schemas = require('./schemas');
var Auth = require('./auth');
var restifyCookies = require('restify-cookies');

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var sessions        = require("client-sessions");
var kwsEnv = require('./kbwebsvr-env');


/* Passport Initialization */

var JSON_CONTENT = {'Content-Type': 'application/json; charset=utf-8'};

// setup the server
var server = restify.createServer({name: 'KBWEB SERVER', version: '1.0.0'});
server.pre(restify.pre.userAgentConnection());
server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser({mapParams: false}));
server.use(restifyCookies.parse);
//server.use(restify.CORS());


var mongodb_inst = mongojs(kwsEnv.mongodb_uri, []);

/* Passport Initialization */
/* replace with auth initialize

server.use(sessions({
    // cookie name dictates the key name added to the request object
    // DONT CHANGE THIS OR IT BREAKS THE CODE
    // Changing this and res.[cookieName], does set the cooking, but the read does not process accurately
    cookieName: 'session',
    // should be a large unguessable string
    secret:  kwsEnv.session_secret,                       //'yoursecret', //new deploys will change the secret if needed
    // how long the session will stay valid in ms
    duration: kwsEnv.session_timeout
}));

server.use(passport.initialize());
server.use(passport.session());

passport.serializeUser(function(user, done) {
    var id = (user['id']) ? user.id : user._id.toString();
    console.log('serialize called on ' + JSON.stringify(user));
    done(null, id);
});


var lookupUser = function(id, done) {
    var collection = mongodb_inst.collection('users');
    var oid = mongojs.ObjectId(id);

    collection.findOne({_id: oid}, function(err, user) {
        if (err) {
            return done(null, false, { error: 'Incorrect username or password.' });
        }
        // verify the password in the hash
        user.password = undefined;

        return done(null, user);
    });

};


// This is how a user gets deserialized
passport.deserializeUser(lookupUser);

// Lookup a user in our database
var verifyUser = function(username, password, done) {
    var collection = mongodb_inst.collection('users');

    collection.findOne({"login": username}, function(err, user) {
        if (err) {
            return done(null, false, { error: 'Incorrect username or password.' });
        }

        // verify the password in the hash

        console.log(user.password)
        return done(null, user);
    });
};

passport.use(new LocalStrategy({ usernameField: 'username', session: true }, verifyUser));
*/
// need to create a login route

/* END PASSPORT */



//maxPoolSize  increase in production ?maxPoolSize=40
// dont do this in test as it opens all for  connections
rmep.setConfig({db: mongodb_inst
               ,secure: false
               ,file: {shoots: {dir: '/home/dsteeber/dev/kbweb/src/misc_docs/shoots', urlRoot: '/misc_docs/shoots'}}});

// notes might change crud to role based
// {read: open, create: admin, update:admin}
// add security later
// need to figure out how to link resources
/* REST ENDPOINTS */

/* LOGIN ENDPOINT */
var auth = new Auth({db: mongodb_inst});
server.use(auth.initialize());

// secure all of the write / delete / update endpoints
/// testing, turning off the auth functionality check
['POST', 'PUT', 'DELETE'].forEach(function(method) {
    auth.secure( /^\/rest\/.*/g, method, ['ADMIN']);
});

auth.secure( /^\/rest\/users.*/g, 'GET', ['ADMIN']);


// add auth secure to message center get
//auth.secure( /^\/rest\/v1\/messageCenterMessages/g, 'GET', ['MEMBER', 'ADMIN']);

server.use(function(req, res, next) {
//   console.log("here here");
    var rtn;

    try {
        rtn = next();
    } catch (exc) {
        console.log(exc);

        res.writeHead(401, JSON_CONTENT);
        res.end(JSON.stringify(exc));
    }
    return rtn;
});

/* replace with auth initialize
server.use(function(req, res, next) {
    //skip this if the user is logging in or logging out
    if (req.url.match( /\/auth\/log[in|out][\/.*]?/ )) {
        return next();
    }

    if ((! auth.requiresAuth(req.url, req.method)) || (req.isAuthenticated())) {
        return next();
    } else {
        // send back not logged in unauth
        res.writeHead(401, JSON_CONTENT);
        res.end(JSON.stringify({message: 'user not logged in'}));
    }
});
*/
//server.use(auth.restifyPlugin);

var loginCollection = mongodb_inst.collection("users");

/*
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

var loginRoute = function(req, res, next) {
    // The local login strategy
    passport.authenticate('local', function(err, user) {
        if (err) {
            return next(err);
        }

        // Technically, the user should exist at this point, but if not, check
        if(!user) {
            return next(new restify.InvalidCredentialsError("Please check your details and try again."));
        }

        // Log the user in!
        req.logIn(user, function(err) {
            if (err) {
                return next(err);
            }
            console.log(req.isAuthenticated());
            req.session.user_id = req.user.id;

            if(user.username) {
                res.json({ success: 'Welcome ' + user.username + "!"});
                return next();
            }

            res.json({ success: 'Welcome!'});
            return next();
        });

    })(req, res, next);
};


server.post("/auth/login", loginRoute);
*/
/*
 * Just returns whether you are logged in or not.

server.get("/auth/login", function(req,res,next) {
    if (req.user && req.isAuthenticated()) {
        var token = {};
        res.writeHead(200, JSON_CONTENT);
        token['authenticated'] = true;
        token['message'] = 'Authenticated';
        token.user = {name: {firstName: 'fixme', lastName: 'in server get auth login'}};
        res.end(JSON.stringify(token));
    } else {
        res.writeHead(200, JSON_CONTENT);
        res.end(JSON.stringify({authenticated: false, message: "Not Authenticated"}));
    }
});
*/
/* LOGIN ENDPOINT */



// add a rest point for all items in the schema map
for (var key in schemas) {
    rmep.createEndPoint(server, 'CRUD'
                   ,{name: key + 's', basePath: '/rest', schema: schemas[key]});
}

var SecureDoc = require('./secure-doc');
var secureDoc = new SecureDoc(kwsEnv.secure_doc_root);
secureDoc.createEndPoints(server);

auth.createEndPoints(server);


server.listen(3000, function() {
   console.log('%s listening at %s', server.name, server.url);
});

