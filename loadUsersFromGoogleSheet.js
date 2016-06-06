// This is a total rewrite of the load users script.  No more connecting directly to the mongodb.
// This script will call into the rest endpoint to create the user.
var kwsEnv = require('./kbwebsvr-env');
var GoogleSpreadsheet = require("google-spreadsheet");
var async = require('async');
var logger = require('./kbwebsvr-logger');


// spreadsheet key is the long id in the sheets URL
var spreadsheet = new GoogleSpreadsheet(kwsEnv.googleMembersSheet.sheetID);
var spreadsheetFilter = 'lastname != ""';
//logger.info('****************TEST, remove setting last name to Honold');
//spreadsheetFilter = 'lastname = "Honold"';

var account_creds = require('./google-generated-creds.json');

var restify = require('restify');

//TODO:  make this endpoint an environment config in kbwebsvr-env.js file
const REST_ENDPOINT = {url: 'http://localhost:10080', version: '*'};
var restClient = restify.createJSONClient(REST_ENDPOINT);


//TODO:  right now testing without secure endpoints.  Really want to make this an API key authentication structure
//TODO:  or ignore authentication if the script is running on the same server, and accessing the server kbwebsvr port directly

// encrypt this and add it into the configs
// restClient.basicAuth(login, password);

// test out the get by email id
function findUser(email, callback) {
    // not sure if I need to url encode this or if it is automatically done
    // there are two ways to do a query.  One is direct field matching  AND only query
    // the other could be a query string i.e. q={} with boolean logic.

    restClient.get('/rest/users?limit=1&email=' + email, function(err, req, res, obj) {
        if (err) {
            callback(err, obj);
            return;
        }

        var result = (obj && obj.length > 0) ? obj[0] : null;

        callback(err, result);
    });
}

function updateUser(user) {
    var uri = (user.uri.startsWith(restClient.url.href)) ? user.uri.substring(restClient.url.href.length - 1) : user.uri;
    console.log(uri);

    user.hours = (user.hours) ? user.hours + 1 : 1;

    restClient.put(uri,user, function(err, req, res, obj) {
        console.log("%j", err)
    })
}

findUser('djsteeber@yahoo.com', function(err, user) {
    if (err) {
        console.log(err);
    } else {
        console.log("%j", user);
        if (user) {
            console.log("calling %j", user.uri);
            // update user
            updateUser(user);
        }
    }
});

// Do a simple test to update the hours by 1



