/* SCHEMA */

var reqString = {
     isRequired: true
    ,isString: true
};

var phoneType = {
     phoneType: {isRequired: true}
    ,phoneNumber: {isPhoneNumber: true}
};

var schedule = {
     date: {isRequired:true, isDate:true}
    ,start: {isRequired:true, isTime:true}
    ,end: {isRequired:true, isTime:true}
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
    ,event_type: {isRequired:true, isString:true, isOneOf: [['SHOOT', 'MEETING', 'LEAGUE']]}
    ,location: {pointsTo: 'locations'}
    ,schedule: {isArrayOf: [schedule, 1]}
    ,flyer: {isString:true}
    ,results_doc: {isString:true}
    ,description: reqString
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

var schemaMap = {location:location, event: event, user: user, userProfile : userProfile};
module.exports = schemaMap;


