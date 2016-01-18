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
    ,subject: {isString: true, isRequired: true}
    ,body: {isString: true, isRequired: true}
    ,sender: {pointsTo: 'users'}
};

// make binary a base64 file, might look a other ways to handle this.  For now, not going to worry
// may need to change the storage of the binary so it is not pulled each time
// add document binary id might help
var document = {
     name: {isString: true, isRequired: true}
    ,fileName: {isString: true, isRequired: true}
    ,mimeType: {isString: true, isRequired: true, isOneOf :[['application/msword', 'application/pdf', 'application/excel']]}
    ,fileType: {isString: true, isRequired: true, isOneOf : [['EVENT', 'RESULT', 'NEWSLETTER', 'MEETING', 'MEMBERS']]}
    ,binaryPath: {isString: true}
};

var schemaMap = {location:location, event: event, user: user, userProfile : userProfile, message: message, document: document};
module.exports = schemaMap;


