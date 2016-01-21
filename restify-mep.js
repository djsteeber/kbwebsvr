var mongojs = require('mongojs');
var sv = require('./json-schema-validator');
var passwordhasher = require('password-hash-and-salt');

//change to bcyrpt

var JSON_CONTENT = {'Content-Type': 'application/json; charset=utf-8'};

var protocol = 'http';
var config;
exports.setConfig = function(rconfig) {
  config = rconfig;
  protocol = ((typeof config.secure != 'undefined') && config.secure) ? 'https' : 'http';
}

/* HELPER FUNCTIONS */
function reqBodyAsObject(req) {
   var obj = {};
   var x = typeof req.body;

   try {
      if (req && req.body && (typeof req.body != 'object')) {
         obj = JSON.parse(req.body);
      } else {
         obj = req.body;
      }
   } catch (exc) {
      obj = {};
   }
   return obj;
   //if (typeof req.body == 'undefined') {
   //   req.body = {};
   //}
   //return (typeof req.body == 'object') ? req.body : JSON.parse(req.body);
}

function getCollection (req) {
   //TODO:  2 is hard coded due to /rest/collection.  Need to change this to not hard code based
   // on base uri
   var collectionName = req.route.path.split("/")[2];
  
   return (collectionName != null) ? config.db.collection(collectionName) : null;
}

function addLocationTo(items, req) {
   var data = [];
   for (var n in items) {
      data[n] = addLocationToItem(items[n], req);
   }
   return data;
};

function addLocationToItem(item, req) {
   basePath = protocol + '://' + req.headers.host + req._url.pathname;

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
console.log("gettting items\n");
   var collection = getCollection(req);
   var query = reqBodyAsObject(req);
   // right now just use all of the request body as the query object
   // might want to add in field selection, but that is an add on as the front end can ignore
   //console.log(req);   
   collection.find(query, function(err, items) {
      //TODO:  add in error handling

//console.log(req);
      //add in location
      var data = addLocationTo(items, req);

      res.writeHead(200, JSON_CONTENT);
      res.end(JSON.stringify(data));
      console.log("items sent: gettting items\n");
      return next();
   });
};


/**
 * handler for get on the key of an object
 */
var getItem = function (req, res, next) {
   var collection = getCollection(req);

   try {
      var oid = mongojs.ObjectId(req.params.id);
      collection.findOne({"_id": oid}, function (err, events) {
         res.writeHead(200, JSON_CONTENT);
         res.end(JSON.stringify(events));
      });
   } catch (exc) {
      console.log(exc);
      res.writeHead(404, JSON_CONTENT); // not found
      res.end(JSON.stringify({message: 'Unable to find Object in ' + collection}));
   }
   return next();
}

/**
 * handler for a put request to update the object specified by a key.
 *  all validation has been done prior to this point, only the write to the DB is needed 
 */
var updateItem = function (req, res, next) {
   var basePath = protocol + '://' + req.headers.host + req._url.pathname;
   var obj = reqBodyAsObject(req);
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

   // so, still getting use to closures in here.
   // not able to return out an object, so the methodology has to be done 
   // inside.  weird to me.
   try {
      var oid = mongojs.ObjectId(req.params.id);
      var obj = reqBodyAsObject(req);
      collection.findOne({"_id": oid}, function (err, doc) {
         if (err) {
            res.writeHead(404, JSON_CONTENT);
            res.end(JSON.stringify({message: 'Unable to find Object in ' + collection}));
         } else {
            req.body = mergeInto(doc, obj);
            next();
         }
      });
   } catch(exc) {
      res.writeHead(404, JSON_CONTENT);
      res.end(JSON.stringify({message: 'Unable to find Object in ' + collection}));
   }
}

/**
 * handler used to delete an item referenced by the id on the url.
 */
var delItem = function (req, res, next) {
   var collection = getCollection(req);
   console.log(req.params);
   try {
      var oid = mongojs.ObjectId(req.params.id);
      collection.remove({"_id": oid}, function (err, data) {
         res.writeHead(200, JSON_CONTENT);
         res.end(JSON.stringify(true));
         return next();
      });
   } catch (exc) {
      res.writeHead(404, JSON_CONTENT);
      res.end(JSON.stringify({message: 'Unable to find Object in ' + collection}));
      return next();
   }
}

/**
 * handler to add a new item to the collection
 */
var newItem = function (req, res, next) {

   var collection = getCollection(req);
   var item = reqBodyAsObject(req);

   collection.save(item, function (err, data) {
      if (err) {
         res.writeHead(400, JSON_CONTENT);
         res.end(JSON.stringify(err));
      } else {
         res.writeHead(201, JSON_CONTENT);
         data = addLocationToItem(data, req);
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
    var obj = reqBodyAsObject(req);
    var v = new sv();
    var valid = v.validateInput(obj, schema);
    if (! valid) {
       console.log("error");
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

var hashPassword = function(schema) {
   return function (req, res, next) {
      var obj = reqBodyAsObject(req);
      //TODO change the check to get fields that have isPassword attribute set to true
      //TODO UNTESTED
      if (obj && obj.password) {


         passwordhasher(obj.password).hash(function(error, hash) {
            if(error)
               throw new Error('Something went wrong!');

            obj.password = hash;
            req.body = obj;
            return next();
         });
      }
   }
};

/**
 * creates end points
 * TODO  check the schema, if the schema has a isPassword set to true, then add a hash/salt algorithm
 */
exports.createEndPoint = function(server, epTypes, config) {
   var epName = config.basePath + '/' + config.name;
   var vc = validateBody(config.schema);
   var hpwd = hashPassword(config.schema);

   var epTypeArray = epTypes.split("");
   for (var epInx in epTypeArray) {
      var epType = epTypeArray[epInx]; 
      if (epType == 'C') {
         console.log('adding create endpoint ' + epName);
         if (typeof config.schema === "undefined") {
            server.post(epName, newItem);
         } else {
            server.post(epName, vc, hpwd, newItem);
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

//TODO: This needs a lot of work.
exports.createSearchEndPoint = function(server, epconfig) {
   var entities = ['users'];
   var epName = epconfig.basePath + '/search';

   server.get(epName, function(req, res, next) {
      var item = reqBodyAsObject(req);

      var collectionName = 'users';  //TODO CHANGE THIS
      var collection = config.db.collection(collectionName);

      collection.find({}, function(err, docs) {
         res.writeHead(200, JSON_CONTENT);
         res.end(JSON.stringify(docs));
      });
   });
};
