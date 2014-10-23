var restify = require('restify');
var fs = require('fs');
var mongojs = require('mongojs');
var rmep = require('./restify-mep');
var schemas = require('./schemas');

// setup the server
var server = restify.createServer();

server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());


//maxPoolSize  increase in production ?maxPoolSize=40
// dont do this in test as it opens all for  connections
rmep.setConfig({db: mongojs('mongodb://localhost/archeryweb', [])
               ,secure: false});

// notes might change crud to role based
// {read: open, create: admin, update:admin}
// add security later
// need to figure out how to link resources
/* REST ENDPOINTS */

// add a rest point for all items in the schema map
for (key in schemas) {
    rmep.createEndPoint(server, 'CRUD'
                   ,{name: key + 's', basePath: '/rest/v1', schema: schemas[key]});
}

/* REST ENDPOINTS */



server.listen(3000, function() {
   console.log('%s listening at %s', server.name, server.url);
});

