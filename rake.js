var fs = require('fs');
var mongojs = require('mongojs');
var schemas = require('./schemas');



//create the collections based on the schemas
var db = mongojs('mongodb://localhost/archeryweb', []);

// add a rest point for all items in the schema map
for (var schemaName in schemas) {
  var schema = schemas[schemaName];
  var collectionName = schemaName + 's';
  for (var fieldName in schema) {
     var fieldDef = schema[fieldName];
     if (fieldDef['isUnique']) {
        console.log('Creating unique index for ' + fieldName + ' on ' + collectionName);
        var collection = db.collection(collectionName);
        var fni = {};
        fni[fieldName] = 1;
console.log(JSON.stringify(fni));
        collection.ensureIndex(fni,{unique:true});
     }
  }
}

console.log('done');
db.close();
/* REST ENDPOINTS */




