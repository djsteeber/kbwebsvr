
var validator = require('validator');


module.exports = function JSONSchemaValidator() {
   var fieldErrors = [];

   function addFieldError(fieldName, message) {
      fieldErrors.push({field: fieldName, message: message});
   };


   function validateInput(input, schema) {
      var finalResult = true;
      for (var key in schema) {
         var val = (typeof input[key] == 'undefined') ? null : input[key];
         var result = checkField(key, schema[key], val);
         if (! result) {
            finalResult = false;
         }
      }
      return finalResult;
   };

   function checkField(fieldName, fieldDefinition, value) {
      var result = false;

      for (var fn in fieldDefinition) {
         var f = eval(fn);
         var parms = new Array(value);

         if (Array.isArray(fieldDefinition[fn])) {
            fieldDefinition[fn].map(function(item) {
               parms.push(item);
            });
         } else {
            parms.push(fieldDefinition[fn]);
         }
         result = f.apply(null, parms);
         if (! result) {
            addFieldError(fieldName, fieldName + ' failed ' + fn + ' check on value' + value);
            addFieldError(fieldName, fieldName + ' failed ' + fn + ' check on value' + value);
         }
      }
      return result; 
   };

   function noOp(value, bool) {
     return true;
   }

   function isEmail(value, bool) {
     console.log('isEmail not implemented');
     return true;
   }

   function isDate(value, bool) {
      if (value == null) {
         return true;
      }

      //validator isDate does not work, because a fill date is not passed in.
      // we dont care about this.  we are just going to store year, month date
      try {
         var dtParts = value.split('-');
         if (dtParts.length != 3) {
            return false;
         }

         dtParts = dtParts.map(function (part) {
            return parseInt(part);
         });

         var dt = new Date(dtParts[0], dtParts[1] - 1, dtParts[2]);
         if (dt.getFullYear() != dtParts[0]) {
            return false;
         }
         if (dt.getMonth() != (dtParts[1]-1)) {
            return false;
         }
         if (dt.getDate() != (dtParts[2])) {
            return false;
         }
      } catch (dtParseErr) {
         return false;
      }


      return true;
   }
   function isRequired(value, bool) {
       return (! bool) || ((! validator.isNull(value)) && (validator.isLength(value, 1)));
   }
   function isString(value, bool) {
       return true;
   }
   function isPhoneNumber(value, bool) {
       return true;
   }

   function isTime(value, bool) {
      var checkValue = value;
      if (checkValue == null) return true;

      while ((checkValue.length > 0) && (checkValue.charAt(0) == '0')) {
         checkValue = checkValue.substring(1);
      }
      var time = validator.isInt(checkValue) ? validator.toInt(checkValue) : undefined;

      if (time == undefined) return false;
      return ((time >= 0) && (time <= 2359));
   }

   function isArrayOf(value, item, minCount) {
      minCount = (minCount == undefined) ? 0 : minCount;
      if ((value == null) || (value == undefined)) {
         return (minCount <= 0);
      }

      // if there is something in there, it better be an array
      if (! Array.isArray(value)) {
        return false;
      }
 
      // and since we have an array, there must be at least minCount items in it
      if (value.length < minCount) {
         return false;
      }

      // item is the schema, so call validateInput on the schema against each value in the array
      for (var inx in value) {
         var testVal = value[inx];
         if (typeof testVal == 'object') {
            if (!validateInput(value[inx], item)) {
               return false;
            }
         } else {
            //might be an array of literals, string or numbers
            if (! checkField(value[inx], item)) {
               return false;
            }
         }
      }
         
      return true;
   }

   function isObject(value, item) {
      if (value == null) {
         return true;
      }
      if (! (typeof value == 'object')) {
         return false;
      }
      return validateInput(value, item);
   }

   function isOneOf(value, item) {
      if ((value == null) || (value == undefined)) {
         return true;
      }
      if (Array.isArray(value)) {
         return false;
      }

      return (item.indexOf(value) != -1);
   }
  /* TODO:  need to change this to a type of rest endpoint and id maybe
            at least should be an id
   */
   function pointsTo(value, item) {
      if ((value == null) || (value == undefined)) {
         return true;
      }
      // this should be a valid URI
      // this should have the item name in the value
      // this should end with a UUID
      var parts = value.split('/');
      if (parts.length < 5) {
         return false;
      }

      // protocol
      if (['https:', 'http:'].indexOf(parts[0]) == -1) {
         return false;
      }

      // indicates  the two slashes //
      if (parts[1] != '') {
         return false;
      }

      // the item , object 
      if (parts[parts.length-2] != item) {
         return false;
      }

      // the UUID of the object
      if (! validator.isAlphanumeric(parts[parts.length-1])) {
         return false;
      }
      return true;
     };

   function isUnique(value, item) {
      return true;
   }
   function isPassword(value, item) {
      return true;
   }

   /*
   isFile is an object that containsthat contains either a multi part file from the request
   or a json object equivalent.

    return {name: reqFile.name, tempPath: reqFile.path, size: reqFile.size, type: reqFile.type, lastModifiedDate: req.lastModifiedDate}

    */
   function isFile(value, item) {
      if ((value == null) || (value == undefined)) {
         return true;
      }
      if (typeof value != 'object') {
         return false;
      }

      //match keys on the objects
      if ((value.name == null) || (value.name == undefined)) {
         return false;
      }

      if ((value.tempPath != null) && (value.tempPath != undefined)) {


      }

      return true;
   }

  return {
     // Error capture
     getFieldErrors: function() {
        return fieldErrors;
     },

     isRequired: isRequired,
     isString: isString,
     isPhoneNumber: isPhoneNumber,
     isDate: isDate,
     isTime: isTime,
     isArrayOf: isArrayOf,
     isOneOf: isOneOf,
     pointsTo: pointsTo,
     isObject: isObject,
     isEmail: isEmail,
     isUnique: isUnique,  // no-op function, isUnique is done in the collection creation
     isPassword: isPassword,  //no-op function, just used to hide the password on display
     isFile: isFile,
     checkField: checkField,
     validateInput: validateInput
  };
}

