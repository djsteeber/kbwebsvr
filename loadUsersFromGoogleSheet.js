var mongojs = require('mongojs');
var kwsEnv = require('./kbwebsvr-env');
var GoogleSpreadsheet = require("google-spreadsheet");
var async = require('async');

// spreadsheet key is the long id in the sheets URL
var spreadsheet = new GoogleSpreadsheet('1vQ1gs2PFGfjRx-Mngz7QGcRuqJszGUu6PmGkAuVFl3M');

var account_creds = require('./google-generated-creds.json');
// note: client email in the account credentials need to be given access to the sheet

var kwsEnv = require('./kbwebsvr-env');

var mongodb_inst = mongojs(kwsEnv.mongodb_uri, []);
var userCollection = mongodb_inst.collection('users');
var prCollection = mongodb_inst.collection('passwordReset');

var allDone = function() {
    console.log('done');
    mongodb_inst.close();
};

//TODO:  change this to call the internal rest service so that we do not need
//       to worry about the structure, just to keep clean with the rest endpoint and validation schema
//       for now, a hand hacked version that injects into mongo will work

var addResetPasswordRequest = function(user, callback) {
    var passwordRequest = {
        userID: user._id,
        name: user.name,
        login: user.login,
        email: user.email
    };

    prCollection.insert(passwordRequest, function (err, pr) {
        if (err) {
            console.log(err);
            console.log('user created but the reset password request did not for user ' + JSON.stringify(passwordRequest.name));
        } else {
            console.log('reset password created ' + JSON.stringify(pr.name));
        }
        return callback();
    });
};

var addNewUser = function (user, callback) {
    userCollection.insert(user, function (err, insertedUser) {
        if (err) {
            console.log("error " + err);
            callback();
        } else {
            if (insertedUser) {
                addResetPasswordRequest(insertedUser, callback);
            } else {
                console.log("No user returned from insert");
                callback();
            }
        }
    });
};

var updateUser = function(oid, user, callback) {
    userCollection.update({_id: oid}, user, {multi: false}, function(err) {
        console.log("updating user");
        if (err) {
            console.log(err);
        }
        callback();
    });
};

var processRow = function(row, callback) {
    var name = {
        firstName: row.firstname,
        lastName: row.lastname,
        fullName: row.firstname + ' ' + row.lastname
    };

    var roles = (row.roles) ? row.roles.split(',') : [];
    if (roles.length == 0) {
        roles.push('MEMBER');
    }
    var user = {
        login: row.email,
        name: name,
        email: row.email,
        roles: roles,
        spouse : row.spouse,
        phone: row.phone,
        address: {address: row.address, city: row.city, state: row.state, zip: row.zip},
        hours: (row.hours) ? parseInt(row.hours) : 0,
        exempt: (row.exempt && (row.exempt == 'Lifetime')) ? true : false
        //joindate
        //sponsor
        //note
    };

    // so we want to find the user, and if found, update date it, if not add it
    if (user.login) {
        userCollection.findOne({login: user.login.toLowerCase()}, function(err, foundUser) {
            if (err) {
                console.log(err);
                return callback();
            }
            if (foundUser) {
                // found, we need to do an update.
                var mergedUser = Object.assign({}, foundUser, user);
                var oid = foundUser._id;
                delete mergedUser._id;
                updateUser(oid, mergedUser, callback);
            } else {
                console.log("user not found, insert");
                console.log(row.email);

                // need to create a password, as well as a passwwordReset request
                addNewUser(user, callback);
            }
        });
    }

};

var processRows = function(err, row_data) {
    if (err) {
        console.log(err);
    } else {
        async.forEach(row_data,processRow, allDone);
    }
};


var authCallBack = function(err) {
    if (err) {
        console.log(err);
    } else {
        spreadsheet.getRows( 1, {query: 'lastname != ""'}, processRows);
        // query should be {query: 'email = ""'}
    }
};


spreadsheet.useServiceAccountAuth(account_creds, authCallBack);





