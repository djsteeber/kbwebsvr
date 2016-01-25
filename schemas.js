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
     date: {isRequired:true, isDate:true}
    ,start: {isRequired:true, isTime:true}
    ,end: {isRequired:true, isTime:true}
};

var scheduleTime = {
     start: {isRequired:true, isTime:true}
    ,end: {isRequired:false, isTime:true}
};

var location = {
     name: reqString
    ,address: reqString
    ,city: reqString
    ,state: reqString
    ,zip: reqString
    ,phone: {isArrayOf: phoneType}
};

/* do not mix events.  keep each one distinct
   shoot, meeting, work party.
   don't care if they have a lot in common, right now
   maybe work on an inheritence type schema
 {name: 'Phantom Pig Shoot', date: 'January 23-24, 2016', times: 'Registration @ 8am, Shoot 8:30am - 3pm', info: 'Food, Bar, 3D Targets', link: '#',
 {name: 'Cricket Shoot', date: 'February 6, 2016', times: 'Registration @ 8am, Shoot 8:30am - 3pm', info: 'Food, Bar', link: '#'},


 */
var shoot = {
     name: reqString
    ,description: reqString
    ,dateText: reqString
    ,timeText: reqString
    ,shortDescription: reqString
    ,shootType: reqString
    ,schedule: {isArrayOf: [schedule, 0]} //change to 1 once the ready to move to date times
    ,flyer: {isRequired: false, isFile: true} // change to points to document
    ,results: {isString:true}  // change to points to document
};

/* making this simple, assume everything is at KB location, refactor if needed */
var event = {
     name: reqString
    ,event_type: {isRequired:true, isString:true, isOneOf: [['SHOOT', 'MEETING', 'LEAGUE', 'WORKPARTY']]}
    ,location: {pointsTo: 'locations'}
    ,schedule: {isArrayOf: [schedule, 1]}
    ,flyer: {isString:true} // change to points to document
    ,results_doc: {isString:true}  // change to points to document
    ,description: reqString
    ,status: {isRequired:true, isString:true, isOneOf: [['PENDING', 'APPROVED']]}
};



var personsName = {
     firstName: reqString
    ,lastName: reqString
    ,fullName: {isString: true}
};

// might want to put the user profile in user
// add is hidden
var user = {
     login: {isString: true, isRequired: true, isUnique: true}
    ,name: {isObject: personsName}
    ,email: {isEmail: true, isUnique: true}
    ,password: {isString: true, isRequired: false, isUnique: false, isPassword: true}
    ,roles: {isRequired:true, isOneOf: [['ADMIN', 'MEMBER', 'GUEST']]} // move these roles to a roles.js file
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
     to: {isString: true, isRequired: true, isOneOf: [['ALL MEMBERS', 'BOARD MEMBERS', 'RANGE OFFICERS']]}
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
    ,startDate: reqDate
    ,endDate: reqDate
};


var schemaMap = {location:location, event: event, user: user, userProfile : userProfile, message: message, document: document
    , shoot: shoot, announcement: announcement};
module.exports = schemaMap;


