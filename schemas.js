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

var event = {
    name: reqString
    ,description: reqString
    ,eventType: {isRequired:true, isString:true, isOneOf: [['SHOOT', 'MEETING', 'LEAGUE', 'WORKPARTY']]}
    ,schedule: {isArrayOf: [schedule, 1]}
    ,scheduleStartDate: reqDate
    ,scheduleEndDate: reqDate
};

/* shoot extends from event */
var shoot = Object.assign(event, {
     flyer: {isRequired: false, isFile: true} // change to points to document
    ,results: {isFile:true}  // change to points to document
});

var meeting = event;
var workParty = event;


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
     to: {isString: true, isRequired: true, isOneOf: [['ALL MEMBERS', 'BOARD MEMBERS', 'RANGE OFFICERS', 'OFFICERS']]}
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


var schemaMap = {location:location, event: event, user: user, userProfile : userProfile, message: message, document: document
    , shoot: shoot, announcement: announcement, workParty: workParty, meeting: meeting};
module.exports = schemaMap;


