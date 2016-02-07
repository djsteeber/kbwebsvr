var fs = require('fs');
var mongojs = require('mongojs');
var phash = require('password-hash-and-salt');



var shoots = [
    { name: "Fran's Indoor Animal League",
        description: "10 week Indoor League.",
        shootType: "League",
        schedule: [
            { date: "2016-01-06",  start: "1500",  end: "2100" },
            { date: "2016-01-13",  start: "1500",  end: "2100" },
            { date: "2016-01-20",  start: "1500",  end: "2100" },
            { date: "2016-01-27",  start: "1500",  end: "2100" },
            { date: "2016-02-03",  start: "1500",  end: "2100" },
            { date: "2016-02-10",  start: "1500",  end: "2100" },
            { date: "2016-02-17",  start: "1500",  end: "2100" },
            { date: "2016-02-24",  start: "1500",  end: "2100" },
            { date: "2016-03-02",  start: "1500",  end: "2100" },
            { date: "2016-03-09",  start: "1500",  end: "2100" },
            { date: "2016-03-26",  start: "1500",  end: "2100" }
        ]
    },
    { name: "Indoor Youth League",
        description: "Thursday Indoor League.",
        shootType: "League",
        schedule: [
            { date: "2016-01-07",  start: "1500",  end: "2100" },
            { date: "2016-01-14",  start: "1500",  end: "2100" },
            { date: "2016-01-21",  start: "1500",  end: "2100" },
            { date: "2016-01-28",  start: "1500",  end: "2100" },
            { date: "2016-02-04",  start: "1500",  end: "2100" },
            { date: "2016-02-11",  start: "1500",  end: "2100" },
            { date: "2016-02-18",  start: "1500",  end: "2100" },
            { date: "2016-02-25",  start: "1500",  end: "2100" },
            { date: "2016-03-03",  start: "1500",  end: "2100" },
            { date: "2016-03-10",  start: "1500",  end: "2100" }
        ],
        flyer: { url: "/misc_docs/shoots/2016YouthLeague.jpg", name: "2016YouthLeague.jpg" }
    },
    { name: "3D Indoor Shoot",
        description: "3D target shoot.  24 animal targets on the indoor range.  Test your skill",
        shootType: "Shoot",
        schedule: [
            { date: "2016-01-16", start: "0800", end: "1600" },
            { date: "2016-01-17", start: "0800", end: "1500" }
        ],
        flyer: { url: "/misc_docs/shoots/20163Dflyer.png", name: "20163Dflyer.png" }
    },
    { name: "3D Indoor Shoot",
        description: "3D target shoot.  24 animal targets on the indoor range.  Test your skill",
        shootType: "Shoot",
        schedule: [
            { date: "2016-02-27", start: "0800", end: "1600" },
            { date: "2016-02-28", start: "0800", end: "1500" }
        ],
        flyer: { url: "/misc_docs/shoots/20163Dflyer.png", name: "20163Dflyer.png" }
    },
    { name: "3D Indoor Shoot",
        description: "3D target shoot.  24 animal targets on the indoor range.  Test your skill",
        shootType: "Shoot",
        schedule: [
            { date: "2016-03-12", start: "0800", end: "1600" },
            { date: "2016-03-13", start: "0800", end: "1500" }
        ],
        flyer: { url: "/misc_docs/shoots/20163Dflyer.png", name: "20163Dflyer.png" }
    },
    { name: "Cricket Shoot",
        description: "Indoor Cricket Targets, teams of 2.  This is based on the dart game of cricket. 2 player teams selected at random, shoot at a paper target of a dart board.",
        shootType: "Shoot",
        schedule: [
            { date: "2015-12-26", start: "1800", end: "2100" }
        ],
        flyer: { url: "/misc_docs/shoots/2016CricketNight.png", name: "2016CricketNight.png" }
    },
    { name: "Cricket Shoot",
        description: "Indoor Cricket Targets, teams of 2.  This is based on the dart game of cricket. 2 player teams selected at random, shoot at a paper target of a dart board.",
        shootType: "Shoot",
        schedule: [
            { date: "2016-01-23", start: "1800", end: "2100" }
        ],
        flyer: { url: "/misc_docs/shoots/2016CricketNight.png", name: "2016CricketNight.png" }
    },
    { name: "Cricket Shoot",
        description: "Indoor Cricket Targets, teams of 2.  This is based on the dart game of cricket. 2 player teams selected at random, shoot at a paper target of a dart board.",
        shootType: "Shoot",
        schedule: [
            { date: "2016-02-20", start: "1800", end: "2100" }
        ],
        flyer: { url: "/misc_docs/shoots/2016CricketNight.png", name: "2016CricketNight.png" }
    },
    { name: "Cricket Shoot",
        description: "Indoor Cricket Targets, teams of 2.  This is based on the dart game of cricket. 2 player teams selected at random, shoot at a paper target of a dart board.",
        shootType: "Shoot",
        schedule: [
            { date: "2016-03-26", start: "1800", end: "2100" }
        ],
        flyer: { url: "/misc_docs/shoots/2016CricketNight.png", name: "2016CricketNight.png" }
    },
    { name: "Indoor Spot League",
        description: "Tuesday Indoor League.",
        shootType: "League",
        schedule: [
            { date: "2016-01-05",  start: "1800",  end: "2100" },
            { date: "2016-01-12",  start: "1800",  end: "2100" },
            { date: "2016-01-19",  start: "1800",  end: "2100" },
            { date: "2016-01-26",  start: "1800",  end: "2100" },
            { date: "2016-02-02",  start: "1800",  end: "2100" },
            { date: "2016-02-09",  start: "1800",  end: "2100" },
            { date: "2016-02-16",  start: "1800",  end: "2100" },
            { date: "2016-02-23",  start: "1800",  end: "2100" },
            { date: "2016-03-01",  start: "1800",  end: "2100" },
            { date: "2016-03-08",  start: "1800",  end: "2100" }
        ],
        flyer: { url: "/misc_docs/shoots/2016SpotLeagueFlyer.png", name: "2016SpotLeagueFlyer.png" }
    },
    { name: "KM Shoot",
        description: "Kettle Moraine Indoor Shoot at Kenosha Bowmen.  This is traveling shoot based at various clubs.",
        shootType: "KM Shoot",
        schedule: [
            { date: "2016-02-20", start: "0900", end: "1500" },
            { date: "2016-02-21", start: "0900", end: "1500" }
        ]
    },
    { name: "Dragon Shoot",
        description: "Indoor target shoot. Dragon targets",
        shootType: "Shoot",
        schedule: [
            { date: "2016-03-19", start: "0830", end: "1700" },
            { date: "2016-03-20", start: "0900", end: "1500" }
        ],
        flyer: { url: "/misc_docs/shoots/2016DragonShoot.png", name: "2016DragonShoot.png" }
    },
    { name: "Turkey Shoot",
        description: "3D Outdoor Shoot. Take your best shot at 28 3D TURKEY targets.",
        shootType: "Shoot",
        schedule: [
            { date: "2016-03-26", start: "0800", end: "1500" },
            { date: "2016-03-27", start: "0800", end: "1500" }
        ],
        flyer: { url: "/misc_docs/shoots/2016Turkeyflyer.png", name: "2016Turkeyflyer.png" }
    },

    { name: "KB Spring Outdoor League",
        description: "10 week Outdoor League.  14 targets ranging from 5 to 50+ yards.  Multiple divisions, Traditional, Bowhunter.  A different range each week.",
        shootType: "League",
        schedule: [
            { date: "2016-04-11",  start: "1500",  end: "2100" },
            { date: "2016-04-18",  start: "1500",  end: "2100" },
            { date: "2016-04-25",  start: "1500",  end: "2100" },
            { date: "2016-05-02",  start: "1500",  end: "2100" },
            { date: "2016-05-09",  start: "1500",  end: "2100" },
            { date: "2016-05-16",  start: "1500",  end: "2100" },
            { date: "2016-05-23",  start: "1500",  end: "2100" },
            { date: "2016-05-30",  start: "1500",  end: "2100" },
            { date: "2016-06-06",  start: "1500",  end: "2100" },
            { date: "2016-06-13",  start: "1500",  end: "2100" }
        ]
    },
    { name: "Johnny G. Traditional Shoot",
        description: "3D Outdoor Traditional Shoot.",
        shootType: "Shoot",
        schedule: [
            { date: "2016-05-21", start: "0800", end: "1500" },
            { date: "2016-05-22", start: "0800", end: "1500" }
        ],
        flyer: { url: "/misc_docs/shoots/2016JohnnyGflyer.png", name: "2016JohnnyGflyer.png" }
    },
    { name: "Memorial Day Shoot",
        description: "3D Outdoor Shoot.",
        shootType: "Shoot",
        schedule: [
            { date: "2016-05-28", start: "0800", end: "1500" },
            { date: "2016-05-29", start: "0800", end: "1500" },
            { date: "2016-05-30", start: "0800", end: "1500" }
        ]
    },
    { name: "Kenosha LBL Shoot",
        description: "Outdoor Shoot.",
        shootType: "LBL",
        schedule: [
            { date: "2016-06-11", start: "0800", end: "1500" },
            { date: "2016-06-12", start: "0800", end: "1500" }
        ]
    },
    { name: "KB Tower League",
        description: "Member's only league, shooting 3D from a platform. 7 weeks.  Changing targets and distances. Multi-level platform.",
        shootType: "League",
        schedule: [
            { date: "2016-08-03",  start: "1500",  end: "2100" },
            { date: "2016-08-10",  start: "1500",  end: "2100" },
            { date: "2016-08-27",  start: "1500",  end: "2100" },
            { date: "2016-08-24",  start: "1500",  end: "2100" },
            { date: "2016-08-31",  start: "1500",  end: "2100" },
            { date: "2016-09-07",  start: "1500",  end: "2100" },
            { date: "2016-09-14",  start: "1500",  end: "2100" }
        ]
    },
    { name: "Friday Night Open Shoot",
        description: "Open to the public.  Indoor shooting, open range.",
        shootType: "Open",
        schedule: [
            { date: "2016-02-05", start: "1800", end: "2200" }
        ],
        flyer: { url: "/misc_docs/shoots/2016FridayNightOpenShooting.png", name: "2016FridayNightOpenShooting.png" }
    },
    { name: "Friday Night Open Shoot",
        description: "Open to the public.  Indoor shooting, open range.",
        shootType: "Open",
        schedule: [
            { date: "2016-02-12", start: "1800", end: "2200" }
        ],
        flyer: { url: "/misc_docs/shoots/2016FridayNightOpenShooting.png", name: "2016FridayNightOpenShooting.png" }
    },
    { name: "Friday Night Open Shoot",
        description: "Open to the public.  Indoor shooting, open range.",
        shootType: "Open",
        schedule: [
            { date: "2016-02-19", start: "1800", end: "2200" }
        ],
        flyer: { url: "/misc_docs/shoots/2016FridayNightOpenShooting.png", name: "2016FridayNightOpenShooting.png" }
    },
    { name: "Friday Night Open Shoot",
        description: "Open to the public.  Indoor shooting, open range.",
        shootType: "Open",
        schedule: [
            { date: "2016-03-04", start: "1800", end: "2200" }
        ],
        flyer: { url: "/misc_docs/shoots/2016FridayNightOpenShooting.png", name: "2016FridayNightOpenShooting.png" }
    },
    { name: "Friday Night Open Shoot",
        description: "Open to the public.  Indoor shooting, open range.",
        shootType: "Open",
        schedule: [
            { date: "2016-03-18", start: "1800", end: "2200" }
        ],
        flyer: { url: "/misc_docs/shoots/2016FridayNightOpenShooting.png", name: "2016FridayNightOpenShooting.png" }
    },
    { name: "Friday Night Open Shoot",
        description: "Open to the public.  Indoor shooting, open range.",
        shootType: "Open",
        schedule: [
            { date: "2016-03-25", start: "1800", end: "2200" }
        ],
        flyer: { url: "/misc_docs/shoots/2016FridayNightOpenShooting.png", name: "2016FridayNightOpenShooting.png" }
    }

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



