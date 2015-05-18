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
               ,secure: false});

// notes might change crud to role based
// {read: open, create: admin, update:admin}
// add security later
// need to figure out how to link resources
/* REST ENDPOINTS */

/* LOGIN ENDPOINT */
var auth = new Auth({db: mongodb_inst});

// secure all of the write / delete / update endpoints
['POST', 'PUT', 'DELETE'].forEach(function(method) {
    auth.secure( /^\/rest\/.*/g, method, ['ADMIN']);
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
        res.writeHead(400, JSON_CONTENT);
        res.end(JSON.stringify({message: 'user not logged in'}));
    }
});

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
            res.writeHead(400, JSON_CONTENT);
            res.end(JSON.stringify({message: 'Not Authorized'}));
            return next();
        }
    });
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

/* LOGIN ENDPOINT */

// add a rest point for all items in the schema map
for (var key in schemas) {
    rmep.createEndPoint(server, 'CRUD'
                   ,{name: key + 's', basePath: '/rest/v1', schema: schemas[key]});
}


server.listen(3000, function() {
   console.log('%s listening at %s', server.name, server.url);
});

