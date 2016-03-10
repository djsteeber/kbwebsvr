/*
var logger = require('winston');

logger.setLevels({
    debug:0,
    info: 1,
    silly:2,
    warn: 3,
    error:4,
});
logger.addColors({
    debug: 'green',
    info:  'cyan',
    silly: 'magenta',
    warn:  'yellow',
    error: 'red'
});

logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, { level: 'debug', colorize:true });

module.exports = logger;
*/
var winston = require('winston');
winston.emitErrs = true;

var logger = new winston.Logger({
    transports: [
        /*
        new winston.transports.File({
            level: 'info',
            filename: './logs/all-logs.log',
            handleExceptions: true,
            json: true,
            maxsize: 5242880, //5MB
            maxFiles: 5,
            colorize: false
        }),
        */
        new winston.transports.Console({
            level: 'debug',
            timestamp: true,
            handleExceptions: true,
            json: false,
            colorize: true
        })
    ],
    exitOnError: false
});

module.exports = logger;
module.exports.stream = {
    write: function(message, encoding){
        logger.info(message);
    }
};
