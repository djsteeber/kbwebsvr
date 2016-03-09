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


var emailTemplate = {
    html: stcompile(fs.readFileSync('./config/password-email-template.html', 'utf-8')),
    text: stcompile(fs.readFileSync('./config/password-email-template.txt', 'utf-8'))
};



var mongodb_inst = mongojs(kwsEnv.mongodb_uri, []);
var userCollection = mongodb_inst.collection('users');
var requestCollection = mongodb_inst.collection('passwordReset');


// setup a timer to run the function
var transporter = nodemailer.createTransport(ses({
    accessKeyId: kwsEnv.aws_ses_key,
    secretAccessKey: kwsEnv.aws_ses_secret,
    region: 'us-west-2',
    rateLimit: 14
}));



var generateRandomPassword = function() {
    var password = generator.generate({
        length: 10,
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
            console.log('password reset request not removed');
        } else {
            console.log('password reset request removed ' + requestID);
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

    transporter.sendMail({
        from: 'kenoshabowmen@gmail.com',
        to: user.email,
        subject: 'KenoshaBowmen Website password reset request',
        text: emailTemplate.text(data),
        html: emailTemplate.html(data)
    }, function (err, info) {
        if (err) {
            console.log("error sending the email");
            console.log(err.message);
            console.log(JSON.stringify(info));
            callback();
        } else {
            console.log("email looks like it worked, time to remove the record");
            removeRequest(requestID, callback);
        }
    });
};

var resetUserPassword = function(requestID, user, callback) {
    var password = generateRandomPassword();
    phash(password).hash(function (err, hashedpassword){
        user.password = hashedpassword;
        userCollection.update({_id: user._id}, user, {multi: false}, function (err, data) {
            console.log("updating user " + user.name.fullName + ' to ' + password );
            if (err) {
                console.log(err);
                callback();
            } else {
                sendEmail(requestID, user, password, callback);
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

var allDone = function(err) {
    mongodb_inst.close();
    return;
};

var processAll = function() {

    requestCollection.find(function(err, requests) {
        async.forEach(requests, processRequest, allDone);

       console.log(JSON.stringify(requests));
    });


};

//specified in minutes, defaults to 5 minutes
var runInterval = (kwsEnv.reset_password_interval || 5) * 60 * 1000;

console.log('Starting resetPasswordJob, with an check interval of ' + runInterval + 'ms. ');
setInterval(processAll, runInterval);



