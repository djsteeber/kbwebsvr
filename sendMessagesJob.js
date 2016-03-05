var fs = require('fs');
var mongojs = require('mongojs');
var kwsEnv = require('./kbwebsvr-env');
var async = require('async');
var nodemailer = require('nodemailer');
var ses = require('nodemailer-ses-transport');
var htmlToText = require('html-to-text');


var mongodb_inst = mongojs(kwsEnv.mongodb_uri, []);
var msgCollection = mongodb_inst.collection('messages');
var userCollection = mongodb_inst.collection('users');

// setup a timer to run the function
var transporter = nodemailer.createTransport(ses({
    accessKeyId: kwsEnv.aws_ses_key,
    secretAccessKey: kwsEnv.aws_ses_secret,
    region: 'us-west-2',
    rateLimit: 14
}));


var removeRequest = function(requestID, callback) {
    msgCollection.remove({_id: requestID}, function(err) {
        if (err) {
            console.log('message not removed');
        } else {
            console.log('message removed ' + requestID);
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
            to: user.email,
        subject: message.subject,
        text: text,
        html: html
    };

    //TODO add in no send option
//    console.log('sending ... ' + JSON.stringify(msg));
//    callback();

    transporter.sendMail(
        msg,
        function (err, info) {
            if (err) {
                console.log("error sending the email");
                console.log(err.message);
                console.log(JSON.stringify(info));
                callback();
            } else {
                console.log("email looks like it worked, time to remove the record");
                callback();
            }
        }
    );

};

var processRequest = function(message, prCallback) {
    var oid = mongojs.ObjectId(message.userID);
    //based on msg.to we select the query to run
    // for all members the query is {}
    // for board members, we need to put an attribute on users that says board member
    // probably better to have a role

    query = {email: {"$ne": ""}};
    /*
    query = {login: 'djsteeber@yahoo.com'};
    if (message.to == 'ALL MEMBERS') {
        query = {login: 'djsteeber@yahoo.com'};
    }
*/
    userCollection.find(query, function (err, users) {
        if (err || (! users)) {
            prCallback();
        } else {
            async.forEach(
                users,
                function(user, callback) {
                    sendEmail(user, message, callback);
                },
                prCallback);
        }
    });
};

var allDone = function(err) {
    mongodb_inst.close();
    return;
};

var processAll = function() {

    msgCollection.find(function(err, requests) {
        async.forEach(requests, processRequest, allDone);

        console.log(JSON.stringify(requests));
    });


};

//setInterval(processAll, 1000 * 60);

processAll();


