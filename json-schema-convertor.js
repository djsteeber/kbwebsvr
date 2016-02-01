/**
 * this module is test.  It is actually not needed since we store dates in mongo as yyyy-mm-dd and the > < >= <= already
 * works with this.  No iso conversion necessary.
 *
 * Really this is needed on input to convert some inbound types to make sure they are stored safely.
 * The possible types are file, password, and html inputs
 * @type {*|exports|module.exports}
 */
var validator = require('validator');

/**
 * module converts json data to json mongo data, as well as moves uploaded files
 * @returns {{getFieldErrors: getFieldErrors, isRequired: isRequired, isString: isString, isPhoneNumber: isPhoneNumber, isDate: isDate, isTime: isTime, isArrayOf: isArrayOf, isOneOf: isOneOf, pointsTo: pointsTo, isObject: isObject, isEmail: isEmail, isUnique: isUnique, isPassword: isPassword, isFile: isFile, checkField: checkField, validateInput: validateInput}}
 */
module.exports = function JSONSchemaConvertor() {
   var self = this;
   self.config = {};

   //TODO fix recursion later
   function convert(data, schema, collection) {
      //isFile
      //isPassword
      //isDate
      //isHtml  or isString, to ensure java script injection is not done, although it might not matter
      // might be beneficial to embed the request ip address into the token and validate that from the request as well
      // extra level of security


      var finalResult = {};
      for (var key in schema) {
         var val = (typeof data[key] == 'undefined') ? null : data[key];
         finalResult[key] = convertField(key, schema[key], val);
      }
      return finalResult;
   }

   function convertField(fieldName, fieldDefinition, value) {
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
            addFieldError(fieldName, fieldName + ' failed ' + fn + ' check');
         }
      }
      return result;
   };


   function noOp(value, bool) {
     return true;
   }

   function isEmail(value, bool) {
      return value;
   }

   function isDate(value, bool) {

      return new Date(value);
   }
   function isRequired(value, bool) {
      return value;
   }
   function isString(value, bool) {
      return value;
   }
   function isPhoneNumber(value, bool) {
       return value;
   }

   function isTime(value, bool) {
      return value;
   }

   function isArrayOf(value, item, minCount) {
      if ((value == null) || (value == undefined)) {
         return value;
      }

      // if there is something in there, it better be an array
      if (! Array.isArray(value)) {
        return value;
      }
 
      // item is the schema, so call validateInput on the schema against each value in the array
      for (var inx in value) {
         var testVal = value[inx];
         if (typeof testVal == 'object') {
            return value;

            //if (!validateInput(value[inx], item)) {
            //   return false;
            //}
         } else {
            return value;
            //might be an array of literals, string or numbers
            //if (! checkField(value[inx], item)) {
            //   return false;
           // }
         }
      }
         
      return value;
   }

   function isObject(value, item) {
      if (value == null) {
         return value;
      }
      return value;
//      return validateInput(value, item);
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
      return value;
     };

   function isUnique(value, item) {
      return value;
   }
   function isPassword(value, item) {
      return value;
   }

   /*
   isFile is an object that containsthat contains either a multi part file from the request
   or a json object equivalent.

    return {name: reqFile.name, tempPath: reqFile.path, size: reqFile.size, type: reqFile.type, lastModifiedDate: req.lastModifiedDate}

    */
   function isFile(value, item) {
      return value;
   }

  return {
     convert: convert
  };
}

