var mongojs = require('mongojs');
var kwsEnv = require('./kbwebsvr-env');
var GoogleSpreadsheet = require("google-spreadsheet");
var async = require('async');
var moment = require('moment');

var winston = require('winston');
winston.emitErrs = true;

var logger = new winston.Logger({
    transports: [
        new winston.transports.Console({
            level: 'debug',
            timestamp: true,
            handleExceptions: true,
            json: false,
            colorize: true
        })
    ],
    exitOnError: false
});

// spreadsheet key is the long id in the sheets URL

//googleEventsSheet:  {sheetID: '1vQ1gs2PFGfjRx-Mngz7QGcRuqJszGUu6PmGkAuVFl3M', tabName: 'Events'},

var spreadsheet = new GoogleSpreadsheet(kwsEnv.googleEventsSheet.sheetID);
var spreadsheetFilter = 'name != ""';

var account_creds = require('./google-generated-creds.json');

var mongodb_inst = mongojs(kwsEnv.mongodb_uri, []);
var COLLECTION_NAME = 'events';

var allDone = function() {
    logger.info('done');
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
        name:               row.name,
        description:        row.description,
        eventType:          row.type.toUpperCase(),
        schedule:           [ {start: startDate, end: endDate} ],
        scheduleStartDate:  startDate,
        scheduleEndDate:    endDate
    };

    return rec;
};


var upsertRecord = function(row, callback) {
    var record = createRecord(row);
    var id = row.uid;

    var collection = mongodb_inst.collection(COLLECTION_NAME);

    if (id) {
        var oid = mongojs.ObjectId(id);

        collection.findOne({'_id': oid}, function(err, item) {
            if (err) {
                logger.info('could not find record with id ' + id);
                callback();
                return;
            }
            var newItem = Object.assign({}, item, record);
            collection.update({'_id': oid}, newItem, function(err, item) {
                if (err) {
                    logger.info('error updating the record ' + JSON.stringify(record));
                } else {
                    logger.info('record updated ' + JSON.stringify(record));
                }
                callback();
            });
        });
    } else {
        collection.insert(record, function (err, item) {
            if (err) {
                logger.info('unable to insert record ' + JSON.stringify(record));
                callback();
                return;
            }
            //TODO this is where you pass an extra callback and shim in the update to the spreadsheet with UID / _id
            logger.info('insert record complete ' + JSON.stringify(record));
            console.warn('add in function to update spreadsheet here with ' + item._id);
            row.uid = item._id;
            row.save(callback);
            //callback();
        });
    }
};

/* eventually this will be changed to a rest call */
var processRow = function(row, callback) {
    var rec = createRecord(row);

    logger.info('processing row data ' + JSON.stringify(row));
    // could add the function here to write back  upsertRecord just needs to send back some params
    // in the callback
    upsertRecord(row, callback );
};

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
                if (info.worksheets[wsInx].title == kwsEnv.googleEventsSheet.tabName) {
                    logger.info("running spreadsheet query by " + spreadsheetFilter);
                    info.worksheets[wsInx].getRows({query: spreadsheetFilter}, processRows);
                    return;
                }
            }
            // this is only called if no worksheets are present
            logger.info('no work sheet found named ' + kwsEnv.googleEventsSheet.tabName);
            allDone();
        });
        // query should be {query: 'email = ""'}
    }
};


spreadsheet.useServiceAccountAuth(account_creds, authCallBack);





