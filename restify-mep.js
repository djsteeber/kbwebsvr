var mongojs = require('mongojs');
var sv = require('./json-schema-validator');


var JSON_CONTENT = {'Content-Type': 'application/json; charset=utf-8'};

var protocol = 'http';
var config;
exports.setConfig = function(rconfig) {
  config = rconfig;
  protocol = ((typeof config.secure != 'undefined') && config.secure) ? 'https' : 'http';
}

/* HELPER FUNCTIONS */
function getCollection (req) {
   var collectionName = req.route.path.split("/")[3];
  
   return (collectionName != null) ? config.db.collection(collectionName) : null;
}

function addLocationTo(items, basePath) {
   var data = [];
   for (var n in items) {
      items[n].uri = basePath + '/' + items[n]._id;
      data[n] = items[n];
   }
   return data;
};

function addLocationToItem(item, basePath) {
   item.uri = basePath + '/' + item._id;
   return item;
};

/**
 * merge source into the target object
 */
var mergeInto = function(target, source) {
   for (var k in source) {
     target[k] = source[k];
   }
   return target;
}
/* HELPER FUNCTIONS */

/* RESTIFY handlers */

/**
 * handler for get on the collection
 */
var getItems = function (req, res, next) {
   var collection = getCollection(req);
   //console.log(req);   
   collection.find(req.params, function(err, items) {
      basePath = protocol + '://' + req.headers.host + req._url.pathname;

      //add in location
      var data = addLocationTo(items, basePath); 

      res.writeHead(200, JSON_CONTENT);
      res.end(JSON.stringify(data));
   });
   return next();
};


/**
 * handler for get on the key of an object
 */
var getItem = function (req, res, next) {
   var collection = getCollection(req);
   var oid = mongojs.ObjectId(req.params.id);


   collection.findOne({"_id": oid}, function(err, events) {
      res.writeHead(200, JSON_CONTENT);
      res.end(JSON.stringify(events));
   });
   return next();
}

/**
 * handler for a put request to update the object specified by a key.
 *  all validation has been done prior to this point, only the write to the DB is needed 
 */
var updateItem = function (req, res, next) {
   var basePath = protocol + '://' + req.headers.host + req._url.pathname;
   var obj = (typeof req.body == 'object') ? req.body : JSON.parse(req.body);
   var oid = mongojs.ObjectId(req.params.id);
   var collection = getCollection(req);

   collection.update({_id: oid}, obj, {multi: false}, function (err, data) {
      if (err) {
         res.writeHead(400, JSON_CONTENT);
         res.end(JSON.stringify(err));
      } else {
         data.uri = basePath;
         res.writeHead(200, JSON_CONTENT);
         res.end(JSON.stringify(data));
      }
   });
   return next();
}

/**
 * will fetch the obj referenced by the id on the url.
 *   merge the body into the object and set the req.body value to the
 *     merged value
 */
var fetchAndMerge = function (req, res, next) {
   var collection = getCollection(req);
   var oid = mongojs.ObjectId(req.params.id);
   var obj = JSON.parse(req.body);

   // so, still getting use to closures in here.
   // not able to return out an object, so the methodology has to be done 
   // inside.  weird to me.
   collection.findOne({"_id": oid}, function(err, doc) {
        if (err) {
          res.writeHead(400, JSON_CONTENT);
          res.end(JSON.stringify({message: 'Unable to find Object in ' + collection}));
        } else {
           req.body = mergeInto(doc, obj);
           next();
        }
   });
}

/**
 * handler used to delete an item referenced by the id on the url.
 */
var delItem = function (req, res, next) {
   var oid = mongojs.ObjectId(req.params.id);
   var collection = getCollection(req);
   console.log(req.params);
   collection.remove({"_id": oid}, function (err, data) {
      res.writeHead(200, JSON_CONTENT);
      res.end(JSON.stringify(true));
   });
   return next();
}

//TODO:  do not just return the data, but also send back a location
/**
 * handler to add a new item to the collection
 */
var newItem = function (req, res, next) {

   var collection = getCollection(req);
   var item = JSON.parse(req.body);
   collection.save(item, function (err, data) {
      if (err) {
         res.writeHead(400, JSON_CONTENT);
         res.end(JSON.stringify(err));
      } else {
         res.writeHead(201, JSON_CONTENT);
         var basePath = protocol + '://' + req.headers.host + req._url.pathname;
         data = addLocationToItem(data, basePath);
         res.end(JSON.stringify(data));
      }
   });
   return next();
}

/**
 * will validate to body of the request with the schema
 */
var validateBody = function (schema) {

  return function(req, res, next) {
    var obj = (typeof req.body == 'object') ? req.body : JSON.parse(req.body);
    var v = new sv();
    var valid = v.validateInput(obj, schema);
    if (! valid) {
       res.writeHead(400, JSON_CONTENT);
       res.end(JSON.stringify(v.getFieldErrors()));
       return;
    }
    return next();
  }
}
/**
 * rest endpoint to return the schema
 */
var displaySchema = function(schema) {
  return function(req, res, next) {
      res.writeHead(200, {
         'Content-Type': 'application/json; charset=utf-8'
      });
     if ((schema == undefined) || (schema == null)) {
        res.end('{}');
     } else {
        res.end(JSON.stringify(schema));
     }
     return next();
  };
};

/**
 * creates end points
 */
exports.createEndPoint = function(server, epTypes, config) {
   var epName = config.basePath + '/' + config.name;
   var vc = validateBody(config.schema);

   var epTypeArray = epTypes.split("");
   for (var epInx in epTypeArray) {
      var epType = epTypeArray[epInx]; 
      if (epType == 'C') {
         console.log('adding create endpoint ' + epName);
         if (typeof config.schema === "undefined") {
            server.post(epName, newItem);
         } else {
            server.post(epName, vc, newItem);
         }
      } else if (epType == 'R') {
         console.log('adding read endpoint ' + epName);
         console.log('adding read endpoint ' + epName + "/:id");
         server.get(epName, getItems);
         server.get(epName + "/:id", getItem);
      } else if (epType == 'U') {
         console.log('adding update endpoint ' + epName + "/:id");
         server.put(epName + "/:id", fetchAndMerge, vc, updateItem);
      } else if (epType == 'D') {
         console.log('adding delete endpoint ' + epName + "/:id");
         server.del(epName + "/:id", delItem);
      }
   }
   // adding in a schema endpoint
   console.log('adding read endpoint ' + epName + '.schema');
   server.get(epName + '.schema', displaySchema(config.schema));
};

