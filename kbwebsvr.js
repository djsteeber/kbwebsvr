/**
 * This is the starting point for the kbwebsvr service.
 * KBWebSvr is dependent on kbwebsvr-env.js file.
 * The env file exports a json object of settings needed to run the service.
 * The following variables need to be set:
 *     session_secret: 'any key you want',
 *     session_timeout: 5 + 60 * 60 * 1000, //5 hours here, Time is in ms
 *     secure_document_root: '/',
 *     mongodb_uri: 'mongodb://localhost/archeryweb',  //ideally this would be a cluster, or more
 *     secure_doc_root: '/opt/data' // the structure under secure_doc_root should be /opt/data/secure-docs and then directories
 *
 */

var fs = require('fs');
var restify = require('restify');
var restifyCookies = require('restify-cookies');
var mongojs = require('mongojs');

var kwsEnv = require('./kbwebsvr-env');
var rmep = require('./restify-mep');
var schemas = require('./schemas');
var Auth = require('./auth');
var SecureDoc = require('./secure-doc');


var mongodb_inst = mongojs(kwsEnv.mongodb_uri, []);
var auth = new Auth({db: mongodb_inst});

rmep.setConfig({db: mongodb_inst
    ,secure: false
    // This is needed on the upload of files.  Need to find a better place for this once the shoots post form

    ,file: {shoots: {dir: '/home/dsteeber/dev/kbweb/src/misc_docs/shoots', urlRoot: '/misc_docs/shoots'}}});


// setup the server
var server = restify.createServer({name: 'KBWEB SERVER', version: '1.0.0'});
// if some error exists that is not caught, then this will catch it
server.use(rmep.catchAllErrors);
server.pre(restify.pre.userAgentConnection());
server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser({mapParams: false}));
server.use(restifyCookies.parse);
server.use(auth.initialize());
//server.use(restify.CORS());


// secure all of the write / delete / update endpoints
/// testing, turning off the auth functionality check
['POST', 'PUT', 'DELETE'].forEach(function(method) {
    auth.secure( /^\/rest\/.*/g, method, ['ADMIN']);
});

auth.secure( /^\/rest\/users.*/g, 'GET', ['ADMIN']);
auth.createEndPoints(server);


// add a rest point for all items in the schema map
for (var key in schemas) {
    rmep.createEndPoint(server, 'CRUD'
                   ,{name: key + 's', basePath: '/rest', schema: schemas[key]});
}

var secureDoc = new SecureDoc(kwsEnv.secure_doc_root);
secureDoc.createEndPoints(server);


server.listen(3000, function() {
   console.log('%s listening at %s', server.name, server.url);
});

