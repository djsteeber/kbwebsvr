var fs = require('fs');
var restify = require('restify');
var mongojs = require('mongojs');
var icalToolkit = require('ical-toolkit');
var logger = require('./kbwebsvr-logger');

var RestifyICal = function(config) {

    var self = this;

    self.config = config;


    var createEvent = function(shoot, sched) {
        //   if (_event.organizer) lines.push('ORGANIZER;' + (!!_event.organizer.sentBy ? ('SENT-BY="MAILTO:' + _event.organizer.sentBy + '":') : '') + 'CN="' + _event.organizer.name.replace(/"/g, '\\"') + '":mailto:' + _event.organizer.email);

        var evt = { //Event start time, Required: type Date()
            start: sched.start,
            end: sched.end,
            summary: shoot.name,
            uid: shoot._id,
            location: 'Kenosha Bowmen Club',
            description: shoot.description,
            method: 'PUBLISH',
            organizer: {
                name: 'Kenosha Bowmen',
                email: 'kenoshabowmen@gmail.com'
                //sentBy: 'kenoshabowmen@gmail.com' //OPTIONAL email address of the person who is acting on behalf of organizer.
            },
            alarms: [1440, 60], // 1 day, 1 hour prior  no alarms since this needs a description field

            url: 'http://new.kenoshabowmen.com/#shoot/' + shoot._id
        };
        if (sched.repeat) {
            evt.repeating = {
                freq: sched.repeat,
                count: sched.repeatCount
            };
        }
        return evt;

    };

    self.sendICal = function(req, res /*, next */) {
        var builder = icalToolkit.createIcsFileBuilder();
        builder.calname = 'Kenosha Bowmen Shoots';
        //Cal timezone 'X-WR-TIMEZONE' tag. Optional. We recommend it to be same as tzid.
        builder.timezone = 'america/chicago';
        //Time Zone ID. This will automatically add VTIMEZONE info.
        builder.tzid = builder.timezone; // ensure the same
        builder.spacers = false;

        var collection = config.db.collection('shoots');
        collection.find({}, function(err, shoots) {
            if (err) {
                res.writeHead(500, {
                    'Content-Type': 'text/html'
                });
                res.end('error');
                return;
            }

            shoots.forEach(function (shoot /*, inx */) {
                shoot.schedule.forEach(function (sched /* , schedInx */) {
                    builder.events.push(createEvent(shoot, sched));
                });
            });
            res.writeHead(200, {
                'Content-Type': 'text/calendar'
            });

            res.end(builder.toString());
        });
    };



    self.createEndPoints = function(server) {
        logger.info('adding read endpoint /calendar/shoots.ics');
        server.get("/calendar/shoots.ics", self.sendICal);
    };
};




module.exports = RestifyICal;