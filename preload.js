var fs = require('fs');
var mongojs = require('mongojs');
var phash = require('password-hash-and-salt');


var password = "blah";
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
    var db = mongojs('mongodb://localhost/archeryweb', []);

    var users = db.collection('users');
    users.insert(userData);


    console.log('done');
    db.close();
});



