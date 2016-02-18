var fs = require('fs');
var restify = require('restify');
var mongojs = require('mongojs');
var ical = require('ical-generator');

var JSON_CONTENT = {'Content-Type': 'application/json; charset=utf-8'};



var RestifyICal = function(config) {

    var self = this;

    self.config = config;

    self.sendICal = function(req, res, next) {
        var cal = ical({
            domain: 'kenoshabowmen.com',
            name: 'Shoots',
            timezone: 'America/Chicago'
        });
        var collection = config.db.collection('shoots');
        collection.find({}, function(err, shoots) {
            if (err) {
                res.writeHead(500, {
                    'Content-Type': 'text/html'
                });
                res.end('error');
                return;
            }

            shoots.forEach(function (shoot, inx) {
                var shortDesc = shoot.description.split('.')[0];

                shoot.schedule.forEach(function (sched, schedInx) {
                    var event = cal.createEvent({
                        id: shoot._id,
                        start: sched.start,
                        end: sched.end,
                        summary: shortDesc,
                        description: shoot.description,
                        url: 'http://new.kenoshabowmen.com/shoots/' + shoot._id
                    });
                    if (sched.repeat) {
                        event.repeating({
                            freq: sched.repeat,
                            count: sched.repeatCount
                        });
                    }
                });
            });
            res.writeHead(200, {
                'Content-Type': 'text/calendar'
            });

            res.end(cal.toString());
        });
    };



    self.createEndPoints = function(server) {
        console.log('adding read endpoint /calendar/shoots.ics');
        server.get("/calendar/shoots.ics", self.sendICal);
    };
};




module.exports = RestifyICal;