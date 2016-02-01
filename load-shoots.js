var fs = require('fs');
var mongojs = require('mongojs');
var phash = require('password-hash-and-salt');



var shoots = [
    { "name" : "Fran's Indoor Animal League", "description" : "10 week Indoor League.", "shootType" : "League", "schedule" : [ { "date" : "2016-01-06",  "start" : "1500",  "end" : "2100" },{ "date" : "2016-01-13",  "start" : "1500",  "end" : "2100" },{ "date" : "2016-01-20",  "start" : "1500",  "end" : "2100" },{ "date" : "2016-01-27",  "start" : "1500",  "end" : "2100" },{ "date" : "2016-02-03",  "start" : "1500",  "end" : "2100" },{ "date" : "2016-02-10",  "start" : "1500",  "end" : "2100" },{ "date" : "2016-02-17",  "start" : "1500",  "end" : "2100" },{ "date" : "2016-02-24",  "start" : "1500",  "end" : "2100" },{ "date" : "2016-03-02",  "start" : "1500",  "end" : "2100" },{ "date" : "2016-03-09",  "start" : "1500",  "end" : "2100" },{ "date" : "2016-03-26",  "start" : "1500",  "end" : "2100" } ] },
    { "name" : "Indoor Youth League", "description" : "Thursday Indoor League.", "shootType" : "League", "schedule" : [ { "date" : "2016-01-07",  "start" : "1500",  "end" : "2100" },{ "date" : "2016-01-14",  "start" : "1500",  "end" : "2100" },{ "date" : "2016-01-21",  "start" : "1500",  "end" : "2100" },{ "date" : "2016-01-28",  "start" : "1500",  "end" : "2100" },{ "date" : "2016-02-04",  "start" : "1500",  "end" : "2100" },{ "date" : "2016-02-11",  "start" : "1500",  "end" : "2100" },{ "date" : "2016-02-18",  "start" : "1500",  "end" : "2100" },{ "date" : "2016-02-25",  "start" : "1500",  "end" : "2100" },{ "date" : "2016-03-03",  "start" : "1500",  "end" : "2100" },{ "date" : "2016-03-10",  "start" : "1500",  "end" : "2100" }] },
    { "name" : "3D Indoor Shoot", "description" : "3D target shoot.  24 animal targets on the indoor range.  Test your skill", "shootType" : "Shoot", "schedule" : [ 	{ 	"date" : "2016-01-16", 	"start" : "0800", "end" : "1600" }, 	{"date" : "2016-01-17", "start" : "0800", 	"end" : "1500" } ], "flyer" : { "url" : "/misc_docs/shoots/20163Dflyer.png", "name" : "20163Dflyer.png" } },
    { "name" : "3D Indoor Shoot", "description" : "3D target shoot.  24 animal targets on the indoor range.  Test your skill", "shootType" : "Shoot", "schedule" : [ 	{ 	"date" : "2016-02-27", 	"start" : "0800", "end" : "1600" }, 	{"date" : "2016-02-28", "start" : "0800", 	"end" : "1500" } ], "flyer" : { "url" : "/misc_docs/shoots/20163Dflyer.png", "name" : "20163Dflyer.png" } },
    { "name" : "3D Indoor Shoot", "description" : "3D target shoot.  24 animal targets on the indoor range.  Test your skill", "shootType" : "Shoot", "schedule" : [ 	{ 	"date" : "2016-03-12", 	"start" : "0800", "end" : "1600" }, 	{"date" : "2016-03-13", "start" : "0800", 	"end" : "1500" } ], "flyer" : { "url" : "/misc_docs/shoots/20163Dflyer.png", "name" : "20163Dflyer.png" } },
    { "name" : "Cricket Shoot", "description" : "Indoor Cricket Targets, teams of 2.  This is based on the dart game of cricket. 2 player teams selected at random, shoot at a paper target of a dart board.", "shootType" : "Shoot", "schedule" : [  {  "date" : "2015-12-26",  "start" : "1800",  "end" : "2100" } ] },
    { "name" : "Cricket Shoot", "description" : "Indoor Cricket Targets, teams of 2.  This is based on the dart game of cricket. 2 player teams selected at random, shoot at a paper target of a dart board.", "shootType" : "Shoot", "schedule" : [  {  "date" : "2016-01-23",  "start" : "1800",  "end" : "2100" } ] },
    { "name" : "Cricket Shoot", "description" : "Indoor Cricket Targets, teams of 2.  This is based on the dart game of cricket. 2 player teams selected at random, shoot at a paper target of a dart board.", "shootType" : "Shoot", "schedule" : [  {  "date" : "2016-02-20",  "start" : "1800",  "end" : "2100" } ] },
    { "name" : "Cricket Shoot", "description" : "Indoor Cricket Targets, teams of 2.  This is based on the dart game of cricket. 2 player teams selected at random, shoot at a paper target of a dart board.", "shootType" : "Shoot", "schedule" : [  {  "date" : "2016-03-26",  "start" : "1800",  "end" : "2100" } ] },
    { "name" : "Indoor Spot League", "description" : "Tuesday Indoor League.", "shootType" : "League", "schedule" : [ { "date" : "2016-01-05",  "start" : "1800",  "end" : "2100" },{ "date" : "2016-01-12",  "start" : "1800",  "end" : "2100" },{ "date" : "2016-01-19",  "start" : "1800",  "end" : "2100" },{ "date" : "2016-01-26",  "start" : "1800",  "end" : "2100" },{ "date" : "2016-02-02",  "start" : "1800",  "end" : "2100" },{ "date" : "2016-02-09",  "start" : "1800",  "end" : "2100" },{ "date" : "2016-02-16",  "start" : "1800",  "end" : "2100" },{ "date" : "2016-02-23",  "start" : "1800",  "end" : "2100" },{ "date" : "2016-03-01",  "start" : "1800",  "end" : "2100" },{ "date" : "2016-03-08",  "start" : "1800",  "end" : "2100" }] },
    { "name" : "KM Shoot", "description" : "Kettle Moraine Indoor Shoot at Kenosha Bowmen.  This is traveling shoot based at various clubs.", "shootType" : "KM Shoot", "schedule" : [  {  "date" : "2016-02-20",  "start" : "0900",  "end" : "1500" },{  "date" : "2016-02-21",  "start" : "0900",  "end" : "1500" } ] },
    { "name" : "Dragon Shoot", "description" : "Indoor target shoot. Dragon targets", "shootType" : "Shoot", "schedule" : [ 	{ 	"date" : "2016-03-19", 	"start" : "0830", "end" : "1700" }, 	{"date" : "2016-03-20", "start" : "0900", 	"end" : "1500" } ], "flyer" : { "url" : "/misc_docs/shoots/2016DragonShoot.png", "name" : "2016DragonShoot.png" } },
    { "name" : "Turkey Shoot", "description" : "3D Outdoor Shoot. Take your best shot at 28 3D TURKEY targets.", "shootType" : "Shoot", "schedule" : [ 	{ 	"date" : "2016-03-26", 	"start" : "0800", "end" : "1500" }, 	{"date" : "2016-03-27", "start" : "0800", 	"end" : "1500" } ], "flyer" : { "url" : "/misc_docs/shoots/2016Turkeyflyer.png", "name" : "2016Turkeyflyer.png" } }
];



var password = "blah";
phash(password).hash(function(error, hash) {
    if (error) {
        throw new Error('Something went wrong!');
        console.log("ahh");
    }

    //create the collections based on the schemas
    var db = mongojs('mongodb://localhost/archeryweb', []);

    var collection = db.collection('shoots');

    collection.remove();
    for (var shoot in shoots) {
        console.log(JSON.stringify(shoots[shoot]));
        collection.insert(shoots[shoot]);
    }


    console.log('done');
    db.close();
});



