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
            if (row.email.trim().toLowerCase() == user.login) {
                row.uid = oid;
            } else if (row.spouseemail.trim().toLowerCase() == user.login) {
                row.spouseuid = oid;
            } else {
                logger.warn("no match for email " + user.login);
            }
            if (insertedUser) {
                addResetPasswordRequest(insertedUser, callback);
            } else {
                logger.info("No user returned from insert", user);
                callback();
            }
        }
    });
};

var updateUser = function(oid, user, row, callback) {
    userCollection.update({_id: oid}, user, {multi: false}, function(err) {
        if (err) {
            logger.error(err);
            callback();
        } else {
            // here we want to update the row with the UID / oid, but which one, spouse or member
            // check login vs email to see which one
            //right now we are just setting the ids in the row, the save will be done after the row is processed
            if (row.email.trim().toLowerCase() == user.login) {
                row.uid = oid;
            } else if (row.spouseemail.trim().toLowerCase() == user.login) {
                row.spouseuid = oid;
            } else {
                logger.warn("no match for email ", {login: user.login});
            }

            callback();

        }
    });
};


var createProcessRecordFN = function (row) {
  return function(user, callback) {
      userCollection.findOne({login: user.login.toLowerCase()}, function(err, foundUser) {
          if (err) {
              logger.error(err);
              return callback();
          }
          if (foundUser) {
              // found, we need to do an update.
              var mergedUser = Object.assign({}, foundUser, user);
              var oid = foundUser._id;
              delete mergedUser._id;
              updateUser(oid, mergedUser, row, callback);
          } else {
              logger.info("user not found, insert", user);

              addNewUser(user, row, callback);
          }
      });
  };
};
/*
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
*/

/*
 member: {isBoolean:true},
 officer: {isBoolean: true},
 board: {isBoolean: true},
 rangeCaptain: {isBoolean:true},
 bartender: {isBoolean: true},
 boardPosition: {isString: true}

 */
var OFFICER_LIST = ['PRESIDENT', 'VICE-PRESIDENT', 'TREASURER', 'SUB_TREASURER', 'SECRETARY'];
var REMAINING_BOARD_LIST = ['PRACTICE BUTTS', 'MOWING', 'TARGETS', 'EQUIPMENT', 'CLUBHOUSE', 'BAR AGENT'];

function isOfficer(role) {
    return (OFFICER_LIST.indexOf(role) != -1);
}

function isRangeCaptain(role) {
    return ((role === 'INDOOR') || role.startsWith('RANGE'));
}

function isBoard(role) {
    return (REMAINING_BOARD_LIST.indexOf(role) != -1);
}

function isBartender(role) {
    return (role === 'BARTENDER');
}

function updateRoles(user, roles) {
    var rolesAry = (roles) ? roles.split(',') : [];

    user.roles = ['MEMBER'];
    rolesAry.forEach(function(item) {
        var role = item.trim().toUpperCase();
        console.log(role);

        if (isOfficer(role)) {
            user.board = true;
            user.officer = true;
            user.clubPosition = role;
        } else if (isRangeCaptain(role)) {
            user.board = true;
            user.rangeCaptain = true;
            user.clubPosition = role;
        } else if (isBoard(role)) {
            user.board = true;
            user.clubPostion = role;
        } else if (isBartender(role)) {
            user.bartender = true;
            user.clubPosition = role;
        } else {
            user.clubPostion = 'MEMBER';
        }
        
        user.roles.push(role);
    });
    
    return user;
}


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
        user = updateRoles(user,row.roles);
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
        spouse = updateRoles(spouse, row.spouseroles);
        loginRecords.push(spouse);
    }

    return loginRecords;
};

var processRow = function(row, callback) {
    // var create data
    var loginRecords = createLoginRecords(row);

    var processRecord = createProcessRecordFN(row);

    async.forEach(loginRecords, processRecord,
        function() {
            // save the row back
            row.save(
                function() {
                    logger.info("saved spreadsheet for row", {email:  row.email, uid: row.uid, spouseUid: row.spouseuid});
                    callback();
                });
        });
}

var processRows = function(err, row_data) {
    if (err) {
        logger.error(err);
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

//TODO:  fix the async problem,  program is ending before the data is applied to the spreadsheet.


