var mongojs = require('mongojs');
var kwsEnv = require('./kbwebsvr-env');
var GoogleSpreadsheet = require("google-spreadsheet");
var async = require('async');
var moment = require('moment');

// spreadsheet key is the long id in the sheets URL

//googleEventsSheet:  {sheetID: '1vQ1gs2PFGfjRx-Mngz7QGcRuqJszGUu6PmGkAuVFl3M', tabName: 'Events'},

var spreadsheet = new GoogleSpreadsheet(kwsEnv.googleEventsSheet.sheetID);
var spreadsheetFilter = 'name != ""';

var account_creds = require('./google-generated-creds.json');

var mongodb_inst = mongojs(kwsEnv.mongodb_uri, []);
var COLLECTION_NAME = 'events';

var allDone = function() {
    console.log('done');
    mongodb_inst.close();
};

var createDate = function(dt, time) {
    var m = moment(dt + ' ' + time, 'M/D/YYYY h:mm A');

    return m.toDate();
};

var createRecord = function(row) {
    var startDate = createDate(row.startdate, row.starttime);
    var endDate = createDate(row.enddate, row.endtime);

    var rec = {
        name:           row.name,
        description:    row.description,
        schedule: [{start: startDate, end: endDate}],
        scheduleStartDate:  startDate,
        scheduleEndDate:    endDate
    };


    return rec;
};


var upsertRecord = function(id, record, collectionName, callback) {
    var collection = mongodb_inst.collection(collectionName);

    if (id) {
        var oid = mongojs.ObjectId(id);

        collection.findOne({'_id': oid}, function(err, item) {
            if (err) {
                console.log('could not find record with id ' + id);
                callback();
                return;
            }
            var newItem = Object.assign({}, item, record);
            collection.update({'_id': oid}, newItem, function(err, item) {
                if (err) {
                    console.log('error updating the record ' + JSON.stringify(record));
                } else {
                    console.log('record updated ' + JSON.stringify(record));
                }
                callback();
            });
        });
    } else {
        collection.insert(record, function (err, item) {
            if (err) {
                console.log('unable to insert record ' + JSON.stringify(record));
                callback();
                return;
            }
            //TODO this is where you pass an extra callback and shim in the update to the spreadsheet with UID / _id
            console.log('insert record complete ' + JSON.stringify(record));
            console.warn('add in function to update spreadsheet here with ' + item._id);
            callback();
        });
    }
};

/* eventually this will be changed to a rest call */
var processRow = function(row, callback) {
    var rec = createRecord(row);

    console.log('processing row data ' + JSON.stringify(row));
    // could add the function here to write back  upsertRecord just needs to send back some params
    // in the callback
    rec.eventType = 'WORKPARTY';
    upsertRecord(row.uid, rec, COLLECTION_NAME, callback );
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

        spreadsheet.getInfo(function(err, info) {
            if (err) {
                console.log('error getting sheet info');
                return;
            }
            for (var wsInx in info.worksheets) {
                if (info.worksheets[wsInx].title == kwsEnv.googleEventsSheet.tabName) {
                    console.log("running spreadsheet query by " + spreadsheetFilter);
                    info.worksheets[wsInx].getRows({query: spreadsheetFilter}, processRows);
                    return;
                }
            }
            // this is only called if no worksheets are present
            console.log('no work sheet found named ' + kwsEnv.googleEventsSheet.tabName);
            allDone();
        });
        // query should be {query: 'email = ""'}
    }
};


spreadsheet.useServiceAccountAuth(account_creds, authCallBack);





