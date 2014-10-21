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
   ,location: {pointsTo: 'location'}
   ,schedule: {isArrayOf: [schedule, 1]}
   ,flyer: {isString:true}
   ,results_doc: {isString:true}
   ,description: {isString:true, isRequired:true}
};

var schemaMap = {schedule: schedule, location:location, event: event};
module.exports = schemaMap;
