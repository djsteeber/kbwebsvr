/* SCHEMA */

var schedule = {date: {isRequired:true, isDate:true}
                   ,start: {isRequired:true, isTime:true}
                   ,end: {isRequired:true, isTime:true}}

var location = {
    name: {isRequired: true}
   ,address: {isRequired: true}
   ,city: {isRequired: true}
   ,state: {isRequired: true}
   ,zip: {isRequired: true}
   ,phone: {isArrayOf: {phoneType: {isRequired: true}, phoneNumber: {isPhoneNumber: true}}}
};

var event = {
    name: {isString: true, isRequired: true}
   ,event_type: {isRequired:true, isString:true, isOneOf: [['SHOOT', 'MEETING']]}
   ,location: {pointsTo: 'locations'}
   ,schedule: {isArrayOf: [schedule, 1]}
   ,flyer: {isString:true}
   ,results_doc: {isString:true}
   ,description: {isString:true, isRequired:true}
};

var personsName = {firstName: {isString: true, isRequired:true}
                   ,lastName: {isString: true, isRequired:true}
                   ,fullName: {isString: true}};

var user = {
   login: {isString: true, isRequired: true, isUnique: true}
  ,name: {isObject: personsName}
  ,email: {isEmail: true, isUnique: true}
  ,roles: {isRequired:true, isOneOf: [['ADMIN', 'MEMBER', 'GUEST']]}
};

var schemaMap = {location:location, event: event, user: user};
module.exports = schemaMap;

