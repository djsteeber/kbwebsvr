var fs = require('fs');
var mongojs = require('mongojs');
var kwsEnv = require('./kbwebsvr-env');
var async = require('async');
var phash = require('password-hash-and-salt');
var generator = require('generate-password');
var nodemailer = require('nodemailer');
var ses = require('nodemailer-ses-transport');
var kwsEnv = require('./kbwebsvr-env');


var mongodb_inst = mongojs(kwsEnv.mongodb_uri, []);
var userCollection = mongodb_inst.collection('users');
var requestCollection = mongodb_inst.collection('passwordReset');


// setup a timer to run the function
var transporter = nodemailer.createTransport(ses({
    accessKeyId: kwsEnv.aws_ses_key,
    secretAccessKey: kwsEnv.aws_ses_secret,
    region: 'us-west-2'
    //rateLimit: 5
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

var sendEmail = function(user, password, callback) {
    transporter.sendMail({
        from: 'kenoshabowmen@gmail.com',
        to: user.email,
        subject: 'KenoshaBowmen Website password reset request',
        text: 'Hello, You have requested a password reset.  Please enter in your user id and this password ' + password
        + ' to access the system.'
    }, callback);

};

var processRequest = function(request, callback) {
    var password = generateRandomPassword();
    phash(password).hash(function (error, hash) {
        var oid = mongojs.ObjectId(request.userID);
        var obj = {};
        obj.modified = Date.now();
        // hash the password and call update

        if (error) {
            throw new Error('Something went wrong!');
            console.log("ahh");
            callback();
        }

        userCollection.findOne({_id: oid}, function (err, item) {
            if (err) {
                callback();
                return;
            }
            var user = item;
            user.password = hash;
            user.modified = new Date();
            console.log("trying to find id " + oid);
            console.log(JSON.stringify(user));
            userCollection.update({_id: oid}, user, {multi: false}, function (err, data) {
                console.log("updating user " + user.name.fullName + ' to ' + password );
                if (err) {
                    console.log(err);
                }

                // inside of remove

                sendEmail(user, password, function(err, args) {
                    if (err) {
                        console.log("error sending the email");
                        console.log(err.message);
                        callback();
                    } else {
                        console.log("email looks like it worked, time to remove the record");
                        requestCollection.remove({_id: request._id}, function(err) {
                            if (err) {
                                console.log('password reset request not removed');
                            } else {
                                console.log('passowrd reset request removed ' + request._id);
                            }
                            callback();
                        });
                    }
                });
            });
        });
    });
};

var allDone = function(err) {
//    mongodb_inst.close();
    return;
};

var processAll = function() {

    requestCollection.find(function(err, requests) {
        async.forEach(requests, processRequest, allDone);

       console.log(JSON.stringify(requests));
    });


};

setInterval(processAll, 1000 * 60);



