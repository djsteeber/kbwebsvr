var mongojs = require('mongojs');
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


var mongodb_inst = mongojs(kwsEnv.mongodb_uri, []);
var userCollection = mongodb_inst.collection('users');
var prCollection = mongodb_inst.collection('passwordReset');

var allDone = function() {
    logger.info('done');
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
            logger.info('user created but the reset password request did not for user ', {name: passwordRequest.name});
            logger.error(err);
        } else {
            logger.info('reset password created ', {name: pr.name});
        }
        return callback();
    });
};

var addNewUser = function (user, callback) {
    userCollection.insert(user, function (err, insertedUser) {
        if (err) {
            logger.error(err);
            callback();
        } else {
            if (insertedUser) {
                addResetPasswordRequest(insertedUser, callback);
            } else {
                logger.info("No user returned from insert", user);
                callback();
            }
        }
    });
};

var updateUser = function(oid, user, callback) {
    userCollection.update({_id: oid}, user, {multi: false}, function(err) {
        logger.info("updating user ", user);
        if (err) {
            logger.info(err);
        }
        callback();
    });
};


var processRecord = function(user, callback) {

    userCollection.findOne({login: user.login.toLowerCase()}, function(err, foundUser) {
        if (err) {
            logger.info(err);
            return callback();
        }
        if (foundUser) {
            // found, we need to do an update.
            var mergedUser = Object.assign({}, foundUser, user);
            var oid = foundUser._id;
            delete mergedUser._id;
            updateUser(oid, mergedUser, callback);
        } else {
            logger.info("user not found, insert");
            logger.info(user.email);

            addNewUser(user, callback);
        }
    });
};

var createLoginRecords = function(row) {
    var loginRecords = [];


    var memberName = {
        firstName: row.firstname,
        lastName: row.lastname,
        fullName: row.firstname + ' ' + row.lastname
    };
    var spouseName = null;
    if (row.spousefirstname) {
        spouseName = {
            firstName: row.spousefirstname,
            lastName: (row.spouselastname) ? row.spouselastname : row.lastname
        };
        spouseName.fullName = spouseName.firstName + ' ' + spouseName.lastName;
    }

    if (row.email) {
        var memberEmail = row.email.trim().toLowerCase();
        var roles = (row.roles) ? row.roles.split(',') : [];
        roles.push('MEMBER');
        roles = roles.map(function(role) {
            return role.trim().toUpperCase();
        });

        var user = {
            login: memberEmail,
            name: memberName,
            email: memberEmail,
            roles: roles,
            spouse: spouseName,
            phone: row.phone,
            address: {address: row.address, city: row.city, state: row.state, zip: row.zip},
            hours: (row.hours) ? parseFloat(row.hours).toFixed(2) : 0,
            exempt: (row.exempt && (row.exempt == 'Lifetime')) ? true : false
        };
        loginRecords.push(user);
    }
    if (row.spouseemail) {
        var spouseEmail = row.spouseemail.trim().toLowerCase();
        var spouseRoles = (row.spouseroles) ? row.spouseroles.split(',') : [];
        spouseRoles.push('MEMBER');
        spouseRoles = spouseRoles.map(function(role) {
            return role.trim().toUpperCase();
        });

        var spouse = {
            login: spouseEmail,
            name: spouseName,
            email: spouseEmail,
            roles: spouseRoles,
            spouse : memberName,
            phone: (row.spousephone) ? row.spousephone : row.phone,
            address: {address: row.address, city: row.city, state: row.state, zip: row.zip},
            hours: (row.hours) ? parseFloat(row.hours).toFixed(2) : 0,
            exempt: (row.exempt && (row.exempt == 'Lifetime')) ? true : false
        };
        loginRecords.push(spouse);
    }

    return loginRecords;
};

var processRow = function(row, callback) {
    // var create data
    var loginRecords = createLoginRecords(row);

    async.forEach(loginRecords, processRecord, callback);
}

var processRows = function(err, row_data) {
    if (err) {
        logger.info(err);
    } else {
        async.forEach(row_data,processRow, allDone);
    }
};


var authCallBack = function(err) {
    if (err) {
        logger.info(err);
    } else {
        spreadsheet.getInfo(function(err, info) {
            if (err) {
                logger.info('error getting sheet info');
                return;
            }
            for (var wsInx in info.worksheets) {
                if (info.worksheets[wsInx].title == kwsEnv.googleMembersSheet.tabName) {
                    logger.info("running spreadsheet query by " + spreadsheetFilter);
                    info.worksheets[wsInx].getRows({query: spreadsheetFilter}, processRows);
                    return;
                }
            }
            // this is only called if no worksheets are present
            logger.info('no work sheet found named ' + kwsEnv.googleMembersSheet.tabName);
            allDone();
        });
        // query should be {query: 'email = ""'}
    }
};

if (process.argv.length > 2) {
    var parts = process.argv[2].split('=');
    if (parts.length == 2) {
        spreadsheetFilter = parts[0] + '=' + '"' + parts[1] + '"';
    }
}

spreadsheet.useServiceAccountAuth(account_creds, authCallBack);





