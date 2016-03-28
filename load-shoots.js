var fs = require('fs');
var mongojs = require('mongojs');
var phash = require('password-hash-and-salt');

//TODO Runs too quick or slow on server that the inserts do not run before the close statement.
//maybe a good place for async package
var now = Date.now();

var shoots = [
    { name: "Fran's Indoor Animal League",
        description: "10 week Indoor League.",
        shootType: "League",
        range: ["Indoor Range"],
        schedule: [{start: new Date("January 6, 2016 15:00"), end: new Date("January 6, 2016 21:00"), repeat: "WEEKLY", repeatCount: 10}],
        scheduleStartDate: new Date("January 6, 2016 15:00"),
        scheduleEndDate: new Date("March 26, 2016 21:00"),
        created: now,
        modified: now
    },
    { name: "Indoor Youth League",
        description: "Thursday Indoor League.",
        shootType: "League",
        range: ["Indoor Range"],
        flyer: { url: "/misc_docs/shoots/2016YouthLeague.png", name: "2016YouthLeague.png" },
        schedule: [{start: new Date("January 7, 2016 15:00"), end: new Date("January 7, 2016 21:00"), repeat: "WEEKLY", repeatCount: 9}],
        // used for weeding out the current vs past events.  TODO figure out how to make this a trigger on update / insert, most likely in code, yuck
        scheduleStartDate: new Date("January 7, 2016 15:00"),
        scheduleEndDate: new Date("March 10, 2016 21:00"),
        created: now,
        modified: now
    },
    { name: "3D Indoor Shoot",
        description: "3D target shoot.  24 animal targets on the indoor range.  Test your skill",
        shootType: "Shoot",
        range: ["Indoor Range"],
        flyer: { url: "/misc_docs/shoots/20163Dflyer.png", name: "20163Dflyer.png" },
        schedule: [{start: new Date("January 16, 2016 08:00"), end: new Date("January 16, 2016 15:00")},
            {start: new Date("January 17, 2016 08:00"), end: new Date("January 17, 2016 15:00")}],
        scheduleStartDate: new Date("January 16, 2016 08:00"),
        scheduleEndDate: new Date("January 17, 2016 15:00"),
        created: now,
        modified: now
    },
    { name: "3D Indoor Shoot",
        description: "3D target shoot.  24 animal targets on the indoor range.  Test your skill",
        shootType: "Shoot",
        range: ["Indoor Range"],
        schedule: [
            { start: new Date("February 27, 2016 08:00"), end: new Date("February 27, 2016 16:00") },
            { start: new Date("February 28, 2016 08:00"), end: new Date("February 28, 2016 15:00") }
        ],
        flyer: { url: "/misc_docs/shoots/20163Dflyer.png", name: "20163Dflyer.png" },
        scheduleStartDate: new Date("February 27, 2016 08:00"),
        scheduleEndDate: new Date("February 28, 2016 15:00"),
        created: now,
        modified: now
    },
    { name: "3D Indoor Shoot",
        description: "3D target shoot.  24 animal targets on the indoor range.  Test your skill",
        shootType: "Shoot",
        range: ["Indoor Range"],
        schedule: [
            { start: new Date("March 12, 2016 08:00"), end: new Date("March 12, 2016 16:00") },
            { start: new Date("March 13, 2016 08:00"), end: new Date("March 13, 2016 15:00") }
        ],
        flyer: { url: "/misc_docs/shoots/20163Dflyer.png", name: "20163Dflyer.png" },
        scheduleStartDate: new Date("March 12, 2016 08:00"),
        scheduleEndDate: new Date("March 13, 2016 15:00"),
        created: now,
        modified: now
    },
    { name: "Cricket Shoot",
        description: "Indoor Cricket Targets, teams of 2.  This is based on the dart game of cricket. 2 player teams selected at random, shoot at a paper target of a dart board.",
        shootType: "Shoot",
        range: ["Indoor Range"],
        schedule: [
            { start: new Date("December 26, 2015 18:00"), end: new Date("December 26, 2015 21:00") }
        ],
        flyer: { url: "/misc_docs/shoots/2016CricketNight.png", name: "2016CricketNight.png" },
        scheduleStartDate: new Date("December 26, 2015 18:00"),
        scheduleEndDate: new Date("December 26, 2015 21:00"),
        created: now,
        modified: now
    },
    { name: "Cricket Shoot",
        description: "Indoor Cricket Targets, teams of 2.  This is based on the dart game of cricket. 2 player teams selected at random, shoot at a paper target of a dart board.",
        shootType: "Shoot",
        range: ["Indoor Range"],
        schedule: [
            { start: new Date("January 23, 2016 18:00"), end: new Date("January 23, 2016 21:00") }
        ],
        flyer: { url: "/misc_docs/shoots/2016CricketNight.png", name: "2016CricketNight.png" },
        scheduleStartDate: new Date("January 23, 2016 18:00"),
        scheduleEndDate: new Date("January 23, 2016 21:00"),
        created: now,
        modified: now
    },
    { name: "Cricket Shoot",
        description: "Indoor Cricket Targets, teams of 2.  This is based on the dart game of cricket. 2 player teams selected at random, shoot at a paper target of a dart board.",
        shootType: "Shoot",
        range: ["Indoor Range"],
        schedule: [
            { start: new Date("February 20, 2016 18:00"), end: new Date("February 20, 2016 21:00") }
        ],
        scheduleStartDate: new Date("February 20, 2016 18:00"),
        scheduleEndDate: new Date("February 20, 2016 21:00"),
        created: now,
        modified: now,
        flyer: { url: "/misc_docs/shoots/2016CricketNight.png", name: "2016CricketNight.png" }
    },
    { name: "Cricket Shoot",
        description: "Indoor Cricket Targets, teams of 2.  This is based on the dart game of cricket. 2 player teams selected at random, shoot at a paper target of a dart board.",
        shootType: "Shoot",
        range: ["Indoor Range"],
        schedule: [
            { start: new Date("March 26, 2016 18:00"), end: new Date("March 26, 2016 21:00") }
        ],
        scheduleStartDate: new Date("March 26, 2016 18:00"),
        scheduleEndDate: new Date("March 26, 2016 21:00"),
        created: now,
        modified: now,
        flyer: { url: "/misc_docs/shoots/2016CricketNight.png", name: "2016CricketNight.png" }
    },
    { name: "Indoor Spot League",
        description: "Tuesday Indoor League.",
        shootType: "League",
        range: ["Indoor Range"],
        schedule: [
            { start: new Date("January 5, 2016 18:00"), end: new Date("January 5, 2016 21:00"), repeat: 'WEEKLY', repeatCount: 10 }
        ],
        scheduleStartDate: new Date("January 5, 2016 18:00"),
        scheduleEndDate: new Date("March 8, 2016 21:00"),
        created: now,
        modified: now,
        flyer: { url: "/misc_docs/shoots/2016SpotLeagueFlyer.png", name: "2016SpotLeagueFlyer.png" }
    },
    { name: "KM Shoot",
        description: "Kettle Moraine Indoor Shoot at Kenosha Bowmen.  This is traveling shoot based at various clubs.",
        shootType: "KM Shoot",
        range: ["Indoor Range"],
        schedule: [
            { start: new Date("January 5, 2016 18:00"), end: new Date("January 5, 2016 21:00"), repeat: 'DAILY', repeatCount: 2 }
        ],
        scheduleStartDate: new Date("January 5, 2016 18:00"),
        scheduleEndDate: new Date("January 5, 2016 21:00"),
        created: now,
        modified: now
    },
    { name: "Dragon Shoot",
        description: "Indoor target shoot. Dragon targets",
        shootType: "Shoot",
        range: ["Indoor Range"],
        schedule: [
            { start: new Date("March 19, 2016 08:00"), end: new Date("March 19, 2016 15:00"), repeat: 'DAILY', repeatCount: 2 }
        ],
        scheduleStartDate: new Date("March 19, 2016 08:00"),
        scheduleEndDate: new Date("March 20, 2016 15:00"),
        created: now,
        modified: now,
        flyer: { url: "/misc_docs/shoots/2016DragonShoot.png", name: "2016DragonShoot.png" }
    },
    { name: "Turkey Shoot",
        description: "3D Outdoor Shoot. Take your best shot at 28 3D TURKEY targets.",
        shootType: "Shoot",
        range: ["Range 1", "Range 2", "Range 3"],
        schedule: [
            { start: new Date("March 26, 2016 18:00"), end: new Date("March 26, 2016 21:00"), repeat: 'DAILY', repeatCount: 2 }
        ],
        flyer: { url: "/misc_docs/shoots/2016Turkeyflyer.png", name: "2016Turkeyflyer.png" },
        scheduleStartDate: new Date("March 26, 2016 18:00"),
        scheduleEndDate: new Date("March 27, 2016 21:00"),
        created: now,
        modified: now
    },

    { name: "KB Spring Outdoor League",
        description: "10 week Outdoor League.  14 targets ranging from 5 to 50+ yards.  Multiple divisions, Traditional, Bowhunter.  A different range each week.",
        shootType: "League",
        range: ["Range 1", "Range 2", "Range 3", "Range 4"],
        schedule: [
            { start: new Date("April 11, 2016 15:00"), end: new Date("April 11, 2016 21:00"), repeat: 'WEEKLY', repeatCount: 10 }
        ],
        scheduleStartDate: new Date("April 11, 2016 15:00"),
        scheduleEndDate: new Date("June 13, 2016 21:00"),
        created: now,
        modified: now
    },
    { name: "Johnny G. Traditional Shoot",
        description: "3D Outdoor Traditional Shoot.",
        shootType: "Shoot",
        range: ["Range 1", "Range 2", "Range 3"],
        schedule: [
            { start: new Date("May 21, 2016 08:00"), end: new Date("May 21, 2016 15:00"), repeat: 'DAILY', repeatCount: 2 }
        ],
        scheduleStartDate: new Date("May 21, 2016 08:00"),
        scheduleEndDate: new Date("May 22, 2016 15:00"),
        created: now,
        modified: now,
        flyer: { url: "/misc_docs/shoots/2016JohnnyGflyer.png", name: "2016JohnnyGflyer.png" }
    },
    { name: "Memorial Day Shoot",
        description: "3D Outdoor Shoot.",
        shootType: "Shoot",
        range: ["Range 1", "Range 2", "Range 3"],
        schedule: [
            { start: new Date("May 28, 2016 08:00"), end: new Date("May 28, 2016 15:00"), repeat: 'DAILY', repeatCount: 3 }
        ],
        scheduleStartDate: new Date("May 28, 2016 08:00"),
        scheduleEndDate: new Date("May 30, 2016 15:00"),
        created: now,
        modified: now
    },
    { name: "Kenosha LBL Shoot",
        description: "Outdoor Shoot.",
        shootType: "LBL",
        range: ["Range 1", "Range 2", "Range 3"],
        schedule: [
            { start: new Date("June 11, 2016 08:00"), end: new Date("June 11, 2016 15:00"), repeat: 'DAILY', repeatCount: 2 }
        ],
        scheduleStartDate: new Date("June 11, 2016 08:00"),
        scheduleEndDate: new Date("June 12, 2016 15:00"),
        created: now,
        modified: now
    },
    { name: "KB Tower League",
        description: "Member's only league, shooting 3D from a platform. 7 weeks.  Changing targets and distances. Multi-level platform.",
        shootType: "Members Only League",
        range: ["Tower"],
        schedule: [
            { start: new Date("August 03, 2016 15:00"), end: new Date("August 03, 2016 21:00"), repeat: 'WEEKLY', repeatCount: 10 }
        ],
        scheduleStartDate: new Date("August 3, 2016 08:00"),
        scheduleEndDate: new Date("September 14, 2016 15:00"),
        created: now,
        modified: now
    },
    { name: "Friday Night Open Shoot",
        description: "Open to the public.  Indoor shooting, open range.",
        shootType: "Open",
        range: ["Indoor Range"],
        schedule: [
            { start: new Date("February 5, 2016 18:00"), end: new Date("February 5, 2016 22:00")},
            { start: new Date("February 12, 2016 18:00"), end: new Date("February 12, 2016 22:00")},
            { start: new Date("February 19, 2016 18:00"), end: new Date("February 19, 2016 22:00")},
            { start: new Date("March 4, 2016 18:00"), end: new Date("March 4, 2016 22:00")},
            { start: new Date("March 18, 2016 18:00"), end: new Date("March 18, 2016 22:00")},
            { start: new Date("March 25, 2016 18:00"), end: new Date("March 25, 2016 22:00")}
        ],
        flyer: { url: "/misc_docs/shoots/2016FridayNightOpenShooting.png", name: "2016FridayNightOpenShooting.png" },
        scheduleStartDate: new Date("February 5, 2016 18:00"),
        scheduleEndDate: new Date("March 25, 2016 22:00"),
        created: now,
        modified: now
    },
    { name: "Spring Outdoor Field League",
        description: "Outdoor league with NFAA and Hunter round targets.  10 week handicapped team competition.",
        shootType: "Members Only League",
        range: ["Range 1", "Range 2", "Range 3"],
        schedule: [
            { start: new Date("May 03, 2016 08:00"), end: new Date("May 03, 2016 21:00"), repeat: 'WEEKLY', repeatCount: 10 }
        ],
        flyer: { url: "/misc_docs/shoots/2016OutdoorFieldLeague.png", name: "2016OutdoorFieldLeague.png" },
        scheduleStartDate: new Date("May 03, 2016 08:00"),
        scheduleEndDate: new Date("July 05, 2016 20:00"),
        created: now,
        modified: now
    }

];


var async = require('async');


//create the collections based on the schemas
var db = mongojs('mongodb://localhost/archeryweb', []);

var collection = db.collection('shoots');
//collection.remove();


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

async.each(shoots, insertItem, allDone);

