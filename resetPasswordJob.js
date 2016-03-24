var fs = require('fs');
var mongojs = require('mongojs');
var kwsEnv = require('./kbwebsvr-env');
var async = require('async');
var phash = require('password-hash-and-salt');
var generator = require('generate-password');
var nodemailer = require('nodemailer');
var ses = require('nodemailer-ses-transport');
var kwsEnv = require('./kbwebsvr-env');
var stcompile = require('string-template/compile');

var logger = require('./kbwebsvr-logger');


var emailTemplate = {
    html: stcompile(fs.readFileSync('./config/password-email-template.html', 'utf-8')),
    text: stcompile(fs.readFileSync('./config/password-email-template.txt', 'utf-8'))
};



var mongodb_inst = mongojs(kwsEnv.mongodb_uri, []);
var userCollection = mongodb_inst.collection('users');
var requestCollection = mongodb_inst.collection('passwordReset');


// setup a timer to run the function
var transporter = nodemailer.createTransport(ses(kwsEnv.aws_ses_options));


var generateRandomPassword = function() {
    var password = generator.generate({
        length: kwsEnv.gen_password_length | 10,
        numbers: true,
        symbols: false,
        uppercase: true,
        excludeSimilarCharacters: true
    });

    return password;
};

var removeRequest = function(requestID, callback) {
    requestCollection.remove({_id: requestID}, function(err) {
        if (err) {
            logger.info('password reset request not removed');
            logger.error(err);
        } else {
            logger.info('password reset request removed ' + requestID);
        }
        callback();
    });
};


var sendEmail = function(requestID, user, password, callback) {
    var data = {
        name: user.name.firstName,
        login: user.login,
        password: password
    };

    var mailItem = {
        from: 'kenoshabowmen@gmail.com',
        replyTo: 'kenoshabowmen@gmail.com',
        to: user.email,
        subject: 'KenoshaBowmen Website password reset request',
        text: emailTemplate.text(data),
        html: emailTemplate.html(data)
    };

    logger.info('trying to send email ', mailItem);

    transporter.sendMail(mailItem, function (err, info) {
        if (err) {
            logger.info("error sending the email");
            logger.error(err);
            callback();
        } else {
            logger.info("email looks like it worked, time to remove the record", info);
            removeRequest(requestID, callback);
        }
    });
};

var resetUserPassword = function(requestID, user, callback) {
    var password = generateRandomPassword();
    phash(password).hash(function (err, hashedpassword){
        user.password = hashedpassword;
        userCollection.update({_id: user._id}, user, {multi: false}, function (err, data) {
            logger.info("updating user ", user );
            if (err) {
                logger.info(err);
                callback();
            } else {
                if (kwsEnv.do_not_send_email) {
                    logger.info('skipping email send', {email: user.email});
                    callback();
                } else {
                    sendEmail(requestID, user, password, callback);
                }
            }
        });
    });
};

var processRequest = function(request, callback) {
    var oid = mongojs.ObjectId(request.userID);
    userCollection.findOne({_id: oid}, function (err, user) {
        if (err || (! user)) {
            callback();
        } else {
            resetUserPassword(request._id, user, callback);
        }
    });
};



//specified in minutes, defaults to 5 minutes
var runInterval = (kwsEnv.reset_password_interval || 5) * 60 * 1000;


var allDone = function(err) {
    // don't close this here
    if (runInterval < 0 ) {
        mongodb_inst.close();
    }
    return;
};

var processAll = function() {

    requestCollection.find(function(err, requests) {
        if (err) {
            logger.error(err);
        } else {
            logger.info('resetPassword requests found', {count: requests.length});
            async.forEach(requests, processRequest, allDone);
        }
    });


};


if (runInterval < 0) {
    logger.info('Running resetPasswordJob once since interval is less than 0');
    processAll();
    // just run once
} else {
    logger.info('Starting resetPasswordJob, with an check interval of ' + runInterval + 'ms. ');
    setInterval(processAll, runInterval);
}



