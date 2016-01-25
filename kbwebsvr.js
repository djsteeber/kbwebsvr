var restify = require('restify');
var fs = require('fs');
var mongojs = require('mongojs');
var rmep = require('./restify-mep');
var schemas = require('./schemas');
var Auth = require('./auth');
var restifyCookies = require('restify-cookies');


var JSON_CONTENT = {'Content-Type': 'application/json; charset=utf-8'};

// setup the server
var server = restify.createServer({name: 'KBWEB SERVER', version: '1.0.0'});
server.pre(restify.pre.userAgentConnection());
server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser({mapParams: false}));
server.use(restifyCookies.parse);
server.use(restify.CORS());

var mongodb_inst = mongojs('mongodb://localhost/archeryweb', []);

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

// secure all of the write / delete / update endpoints
/// testing, turning off the auth functionality check
['POST', 'PUT', 'DELETE'].forEach(function(method) {
    auth.secure( /^\/rest\/.*/g, method, ['ADMIN']);
});


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


server.use(function(req, res, next) {
    //skip this if the user is logging in or logging out
    if (req.url.match( /\/auth\/log[in|out][\/.*]?/ )) {
        return next();
    }

    //if ((! auth.requiresAuth(req.url, req.method)) || auth.isLoggedIn(req)) {
    //todo if cookie is here, then rest the cookie, so it is passed back.
    if (auth.validateRequest(req)) {

        return next();
    } else {
        // send back not logged in unauth
        res.writeHead(401, JSON_CONTENT);
        res.end(JSON.stringify({message: 'user not logged in'}));
    }
});

server.use(auth.restifyPlugin);

var loginCollection = mongodb_inst.collection("users");

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


//TODO:  Not really removing the cookie, may need to store locally, wonder if the results.token mismatch on the unset is messing it up?  I do see the date change

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

server.get("/auth/login", function(req, res, next) {
    var token = auth.isLoggedIn(req);
    if (token) {
        res.writeHead(200, JSON_CONTENT);
        token['authenticated'] = true;
        token['message'] = 'Authenticated';
        res.end(JSON.stringify(token));
    } else {
        res.writeHead(200, JSON_CONTENT);
        res.end(JSON.stringify({authenticated: false, message: "Not Authenticated"}));
    }
});

/* LOGIN ENDPOINT */

// add a rest point for all items in the schema map
for (var key in schemas) {
    rmep.createEndPoint(server, 'CRUD'
                   ,{name: key + 's', basePath: '/rest', schema: schemas[key]});
}

rmep.createSearchEndPoint(server, {basePath: '/rest'});

auth.createEndPoints(server, '/auth', loginCollection);

// right here need to create a document resource, instead of going through the main one



server.listen(3000, function() {
   console.log('%s listening at %s', server.name, server.url);
});

