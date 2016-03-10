var fs = require('fs');
var mongojs = require('mongojs');
var kwsEnv = require('./kbwebsvr-env');
var async = require('async');
var nodemailer = require('nodemailer');
var ses = require('nodemailer-ses-transport');
var htmlToText = require('html-to-text');

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


var mongodb_inst = mongojs(kwsEnv.mongodb_uri, [],{connectionTimeout: 3000} );

// setup a timer to run the function
var transporter = nodemailer.createTransport(ses({
    accessKeyId: kwsEnv.aws_ses_key,
    secretAccessKey: kwsEnv.aws_ses_secret,
    region: (kwsEnv.aws_region || 'us-west-2'),  //TODO put these in the config file
    pool: true,
    rateLimit: (kwsEnv.mail_rate_limit || 10)
}));


var removeRequest = function(requestID, callback) {
    var msgCollection = mongodb_inst.collection('messages');
    msgCollection.remove({_id: requestID}, function(err) {
        if (err) {
            logger.info('message not removed');
        } else {
            logger.info('message removed ' + requestID);
        }
        callback();
    });
};


var sendEmail = function(user, message, callback) {
    var html = message.body;
    var text = htmlToText.fromString(html, {
        wordwrap: 130
    });

    var msg = {
        from: 'kenoshabowmen@gmail.com',
        //TODO all objects should have a creator and updater id, so we could pull the creator id
        //TODO maybe in the schema, add a field to inject userEmail into record as replyTo
        //replyTo: message.replyTo
        to: user.email,
        subject: message.subject,
        text: text,
        html: html
    };

    if (kwsEnv.do_not_send_email) {
        //TODO add in no send option
        logger.info('skip sending ... ' + JSON.stringify(msg));
        callback();
        return;
    }

    transporter.sendMail(
        msg,
        function (err, info) {
            if (err) {
                logger.warn("error sending the email");
                logger.warn(err.message);
                logger.warn(JSON.stringify(info));
                callback();
            } else {
                logger.info("email sent to " + user.email);
                callback();
            }
        }
    );

};

var processRequest = function(message, prCallback) {
    //based on msg.to we select the query to run
    // for all members the query is {}
    // for board members, we need to put an attribute on users that says board member
    // probably better to have a role

    var query = {email: {"$ne": ""}};
    /*
    query = {login: 'djsteeber@yahoo.com'};
    if (message.to == 'ALL MEMBERS') {
        query = {login: 'djsteeber@yahoo.com'};
    }
*/
    var userCollection = mongodb_inst.collection('users');
    userCollection.find(query, function (err, users) {
        if (err || (! users)) {
            prCallback();
        } else {
            async.forEach(
                users,
                function(user, callback) {
                    sendEmail(user, message, callback);
                },
                function() {
                    removeRequest(message._id, prCallback);
                });
        }
    });
};

var allDone = function(err) {
    //found issue.  Don't close
    //mongodb_inst.close();
    return;
};
//TODO write as a closure so that the db connection can be passed, established and closed in the process.
//TODO for now it is just a global variable, that if errors hoses us
var processAll = function() {

    logger.info("checking for messages to send");
    try {
        var msgCollection = mongodb_inst.collection('messages');
        msgCollection.find(function (err, requests) {
            if (err) {
                logger.warn('error' + err)
            } else {
                async.forEach(requests, processRequest, allDone);
            }
        });
    } catch (err) {
        logger.warn('exception caught in process all');
        logger.err(err);
    }

};

//specified in minutes, defaults to 5 minutes
var runInterval = (kwsEnv.send_message_interval || 5) * 60 * 1000;


// does not work, not sure why.  Leave in for now.  Just do not close connection
mongodb_inst.on('error', function(err) {
    logger.err(err);
});

logger.info('Starting sendMessageJob, with an check interval of ' + runInterval + 'ms. ');
setInterval(processAll, runInterval);
