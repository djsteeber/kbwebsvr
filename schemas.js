/* SCHEMA */

var reqString = {
     isRequired: true
    ,isString: true
};

var reqDate = {isRequired: true, isDate: true};

var phoneType = {
     phoneType: {isRequired: true}
    ,phoneNumber: {isPhoneNumber: true}
};

var schedule = {
     start: {isRequired:false, isDate:true}
    ,end: {isRequired:false, isDate:true}
};

var location = {
     name: reqString
    ,address: reqString
    ,city: reqString
    ,state: reqString
    ,zip: reqString
    ,phone: {isArrayOf: phoneType}
};

var pricing = {

};

/* TODO  change schema definition
    Would love to change this instead of make it function name to handle a standard structure
    e.g.
    EventType: {type: string, required: true, default: 'SHOOT', validation: [isOneOf(['SHOOT', 'MEETING'])]}

    first, check that the type is correct and convert and store the type instead of just as strings
    second check if it is required.
    next, if it is empty, then fill it in with default data
    validation is a list of functions that would verify the type of data.
    schema would need to have the validation functions imported.  Just make a separate module

 */

var event = {
    name: reqString
    ,description: reqString
    ,eventType: {isRequired:true, isString:true, isOneOf: [['SHOOT', 'MEETING', 'LEAGUE', 'WORKPARTY']]}
    ,schedule: {isArrayOf: [schedule, 1]}
    ,scheduleStartDate: reqDate // used for easy of querying current events
    ,scheduleEndDate: reqDate
};

/* shoot extends from event */
//TODO move all events, shoot, etc to event collection
var shoot = Object.assign(event, {
     flyer: {isRequired: false, isFile: true} // change to points to document
    ,results: {isFile:true}  // change to points to document
});

/* @deprecated */
var meeting = event;
/* @deprecated */
var workParty = event;


var personsName = {
     firstName: reqString
    ,lastName: reqString
    ,fullName: {isString: true}
};

//TODO:  Also add in OFFICER, BOARD, RANGE 1-4, All board positions
var roles = ['ADMIN', 'MEMBER', 'GUEST'];
// might want to put the user profile in user
// add is hidden
var user = {
    login: {isString: true, isRequired: true, isUnique: true},
    name: {isObject: personsName},
    email: {isEmail: true, isUnique: true},
    password: {isString: true, isRequired: false, isUnique: false, isPassword: true},
    //TODO:  Need to change this to isArray as there can be multiple
    roles: {isRequired:true, isOneOf: [roles]}, // move these roles to a roles.js file
    member: {isBoolean:true},
    officer: {isBoolean: true},
    board: {isBoolean: true},
    rangeCaptain: {isBoolean:true},
    bartender: {isBoolean: true},
    clubPosition: {isString: true}

};

var userProfile = {
     user : {pointsTo : 'users'}
    ,spouse : {isObject: personsName }
    ,phone: {isArrayOf: phoneType }
    ,additionalClubs : {isArrayOf : {clubName : reqString}}
    ,familyMembers : { isArrayOf: personsName}
    ,skills : {isArrayOf : {name : reqString}}
};

var message = {
     to: {isString: true, isRequired: true, isOneOf: [['ALL MEMBERS', 'MEMBER', 'BOARD', 'OFFICER', 'ADMIN']]}
    ,subject: reqString
    ,body: reqString
    ,sender: {pointsTo: 'users'}
};

// make binary a base64 file, might look a other ways to handle this.  For now, not going to worry
// may need to change the storage of the binary so it is not pulled each time
// add document binary id might help
var document = {
     name: reqString
    ,file: {isFile: true, isRequired: true}
};



//This is good for now, TODO need to learn about dates
var announcement = {
    title: reqString
    ,text: reqString
    ,start: reqDate
    ,end: reqDate
};

var archer = {
    name: reqString,
    age:  reqString
};

var lessonSignup = {
    email:  {isEmail: true, isUnique: true},
    name:   personsName,
    phone:  phoneType,
    archers: {isArrayOf: [archer, 1]}
};


var schemaMap = {location:location, event: event, user: user, userProfile : userProfile, message: message, document: document
    , shoot: shoot, announcement: announcement, workParty: workParty, meeting: meeting, event: event, lessonSignup: lessonSignup};
module.exports = schemaMap;


