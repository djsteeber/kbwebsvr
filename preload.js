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
        login : "djsteeber@yahoo.com",
        name : { firstName : "Dale", lastName : "Steeber", fullName : "Dale Steeber" },
        email : "djsteeber@yahoo.com",
        roles : [ "ADMIN" ],
        spouse : "Jennifer",
        phone : "(847) 548-2716",
        address : { address : "1621 Fairport Dr", city : "Grayslake", state : "IL", zip : "60030" },
        hours : 100,
        exempt : false,
        password: hash
    };





    //create the collections based on the schemas
    users.insert(userData, function() {
        db.close();
    });



    console.log('done');
});



