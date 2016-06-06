

/**
 * RestSchema is a schema that is tied to an endpoint that will handle the data validation an conversion (if necessary)
 * The schema is a json representation of the data. see attributes below.
 * The name represents the name of the schema and can be used as the name of the endpoint
 * 
 * attributes:
 *   name  string representing the name of the object
 *   fields array of field
 *   
 *   field:
 *      name
 *      type (int | real | string | object | array) - standard types that come with default converters and type validators
 *                                                    the default converters and validators will be applied first
 *      validators  array of validator functions
 *      converters  functions to convert the data.  This is done before validations.   
 *      
 *   validators
 *      list of functions to validate that the value of the field is valid
 *      
 * Samples of a RestShema
 * {name: 'user', 
 *  fields: [{name: 'login', type: 'string', validators: [ notEmpty, minSize(5), maxSize(150) ], converters: [lower]},
 *          {name: 'login', type: 'password', validators: [ notEmpty, highPasswordStrength]},
 * 
 * @constructor
 */
var validator = require('./data-validator');

Function.prototype.inheritsFrom = function( parentClassOrObject ){
   if ( parentClassOrObject.constructor == Function )
   {
      //Normal Inheritance
      this.prototype = new parentClassOrObject;
      this.prototype.constructor = this;
      this.prototype.parent = parentClassOrObject.prototype;
   }
   else
   {
      //Pure Virtual Inheritance
      this.prototype = parentClassOrObject;
      this.prototype.constructor = this;
      this.prototype.parent = parentClassOrObject;
   }
   return this;
};


function JSONSchemaField(fieldDef) {
   var self = this;

   self.name = '';
   self.type;
   self.converters = [];
   self.validators = [];

   self.init = function(fieldDef) {
      self.name = fieldDef.name;
      self.type = fieldDef.type;
      self.converters = fieldDef.converters;
      self.validators = fieldDef.validators;

   }

   self.convert = function(value) {
      var tmpValue = value;
      for (var i in self.converters) {
         tmpValue = self.converters[i](tmpValue);
      }
      return value;
   };

   self.validate = function(value) {
      for (var i in self.converters) {
         self.validators[i](value);
      }
   }
}

function JSONSchemaFieldArray(fieldDef) {
   self

}
JSONSchemaFieldArray.inheritsFrom(JSONSchemaField);



function JSONSchemaObject(fields) {
   var self = this;

   self.fields = {};
   for (var key in fields) {
      if (typeof fields[key] === 'JSONSchemaField') {
         self.fields[key] = fields[key];
      } else {
         self.fields[fields[key].name] = new JSONSchemaField(field);
      }
   }

   self.covert = function(value) {
      var rtnObj = {};
      for (var key in value) {
         rtnObj[key] = self.fields[key].convert(value[key]);
      }
      return rtnObj;
   };

   self.validate = function(value) {
      for (var key in value) {
         self.fields[key].validate(value[key]);
      }
   };

   // exception based returns.  If the structure is not valid, an exception is thrown by the checkType function
   // json object is sent in, and a json object is returned, based on the converter functions

   self.validateInput = function(value) {
      if (value) {
         for (var keys in fields) {
            var field = self.fields[key];
            var fieldValue = self.type.convert(value[key]);

            // check the type, if it is a RestSchema object then call its validate function
            var schemaObject = false;
            if (schemaObject) {
               fieldValue = field.type.validateInput(fieldValue);
            } else {
               // run through the convertors

               // then run through the validators
            }
            var fieldValue = field.convert(value[key]);


            field.type.checkType(fieldValue);
         }
      }
   };


}

module.exports JSONSchemaObject;

