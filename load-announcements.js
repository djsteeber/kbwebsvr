var fs = require('fs');
var mongojs = require('mongojs');

var announcements = [
    { title : "Welcome to the new Kenosha Bowmen website",
        text : 'The goal of the site is to offer information about us and our events quickly and easily.</br>' +
        'This has been a long endeavor.</br>' +
        'I hope you enjoy using it as much as I enjoyed building it.</br>' +
        'We do care about your input on how to make the site better.</br>' +
        'If you have any comments, please hold off, and I will put a link to a survey so that feedback can be collected.</br>' +
        '<br/>Come join us, and I hope to see you at an event soon.<br/><br/>Dale aka webmaster '
        ,

        start : new Date("January 1, 2016 01:00"),
        end : new Date("March 26, 2016 23:00")}

];


var async = require('async');


//create the collections based on the schemas
var db = mongojs('mongodb://localhost/archeryweb', []);

var collection = db.collection('announcements');
collection.remove();


var insertItem = function(item, callback) {
    collection.insert(item, function(err, result) {
        console.log(JSON.stringify(item));
        callback();
    });
};

var allDone = function(err) {
    console.log('closing the connection');
    db.close();
}

async.each(announcements, insertItem, allDone);




