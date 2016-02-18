var fs = require('fs');
var mongojs = require('mongojs');
var phash = require('password-hash-and-salt');

var db = mongojs('mongodb://localhost/archeryweb', []);
var users = db.collection('users');
users.remove();


var password = "jun0296";
phash(password).hash(function(error, hash) {
    if (error) {
        throw new Error('Something went wrong!');
        console.log("ahh");
    }

    var userData = {
        login: "dsteeber", name: {firstName: "Dale", lastName: "Steeber", fullName: "Dale Steeber"}
        , email: "djsteeber@yahoo.com", password: hash, roles: "ADMIN"
    };


    //create the collections based on the schemas
    users.insert(userData);

    phash("1401").hash(function(error, hash) {
        if (error) {
            throw new Error('Something went wrong!');
            console.log("ahh");
        }

        var userData = {
            login: "kenoshabowmen", name: {firstName: "Member", lastName: "KB", fullName: "Member at KB"}
            , email: "no-reply@noemail.com", password: hash, roles: "MEMBER"
        };


        users.insert(userData);


        console.log('done');
        db.close();
    });


    console.log('done');
});



