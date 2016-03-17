var mongojs = require('mongojs');
var sv = require('./json-schema-validator');
var passwordhasher = require('password-hash-and-salt');
var fs = require('fs');
var sanitizefn = require("sanitize-filename");
var logger = require('./kbwebsvr-logger');

//change to bcyrpt

var JSON_CONTENT = {'Content-Type': 'application/json; charset=utf-8'};

var protocol = 'http';
var config;
exports.setConfig = function(rconfig) {
  config = rconfig;
  protocol = ((typeof config.secure != 'undefined') && config.secure) ? 'https' : 'http';
}

function createJSONFile(reqFile) {
   return {name: reqFile.name, path: reqFile.path, size: reqFile.size, type: reqFile.type}
}

/* HELPER FUNCTIONS */
/* change this to get request data.  if not data element of request is found, it will parse out the body and add it to
  the data field of the request object.
 */
function getRequestData(req) {
   if (req.data) {
      return req.data;
   }

   var obj = {};
   var x = typeof req.body;

   try {

      if (req.body) {
         if (typeof req.body == 'object') {
            obj = req.body;
         } else {
            try {
               obj = JSON.parse(req.body);
               for (var objKey in obj) {
                  try {
                     obj[objKey] = JSON.parse(obj[objKey]);
                  } catch (fieldParseIgnore){
                     /* ignore */
                  }
               }
            } catch (err) {
               logger.info(err);
               obj = {};
            }
         }
      }

      if (req.params) {
         try {
            var value = req.params;
            for (var objKey in value) {
               obj[objKey] = value[objKey];
            }
         } catch (paramsConversionExc) {
            /* ignore */
         }
      }

      if (req.files) {
         for (var fkey in req.files) {
            var jsonFile = createJSONFile(req.files[fkey]);
            obj[fkey] = jsonFile;
         }
      }
   } catch (exc) {
      obj = {};
   }
   req.data = obj;

   return obj;
}

function getCollectionName(req) {
   var collectionName = req.route.path.split("/")[2].toLowerCase();

   return collectionName;
}

function getCollection (req) {
   //TODO:  2 is hard coded due to /rest/collection.  Need to change this to not hard code based
   // on base uri
   var collectionName = getCollectionName(req);
  
   return (collectionName != null) ? config.db.collection(collectionName) : null;
}

function addLocationTo(items, req) {
   var data = [];
   for (var n in items) {
      data[n] = addLocationToItem(items[n], req);
   }
   return data;
}

function addLocationToItem(item, req) {
   basePath = protocol + '://' + req.headers.host + req._url.pathname;

   item.uri = basePath + '/' + item._id;
   return item;
}

/**
 * merge source into the target object
 */
var mergeInto = function(target, source) {
   for (var k in source) {
     target[k] = source[k];
   }
   return target;
};
/* HELPER FUNCTIONS */

/* RESTIFY handlers */

var convertDates = function(obj) {
   var rtn = {};
   for (var key in obj) {
      var val = obj[key];
      if (typeof val == 'object') {
         rtn[key] = convertDates(val);
      } else if (typeof val == 'string') {
         try {
            var dt = new Date(val);
            rtn[key] = dt;
         } catch(err) {
            rtn[key] = val;
         }
      } else {
         rtn[key] =  val;
      }
   }
   return rtn;
};
/**
 * handler for get on the collection
 */
var getItems = function (req, res, next) {
logger.info("gettting items\n");
   var collection = getCollection(req);
   var collectionName = getCollectionName(req);
   var reqData = getRequestData(req);
   var query = (reqData.q) ? reqData.q : {};
   var sort =  (reqData.sort) ? reqData.sort : null;
   var limit =  (reqData.limit) ? reqData.limit : null;
   var options = {};

   limit = (limit && (typeof limit == 'string')) ? parseInt(limit) : limit;
   if (sort) {
      options.sort = {};
      for (var sortKey in sort) {
         options.sort[sortKey] = (typeof sort[sortKey] == "string") ? parseInt(sort[sortKey]) : sort[sortKey];
      }
   }
   if (limit) {
      options.limit = limit;
   }

   //var query = getRequestData(req);
   // right now just use all of the request body as the query object
   // might want to add in field selection, but that is an add on as the front end can ignore
   //logger.info(req);
   logger.info("find in collection " + collectionName)
   logger.info("   query " + JSON.stringify(query));
   logger.info("   options " + JSON.stringify(options));
try {
//   collection.find(query, null, options, function (err, items) {
   collection.find(query, null, options, function (err, items) {
      if (err) {
         logger.info(err);
      }
//logger.info();
      //add in location
      var data = addLocationTo(items, req);

      res.writeHead(200, JSON_CONTENT);
      res.end(JSON.stringify(data));
      logger.info("items sent: gettting items\n");
      return next();
   });
} catch (findexc) {
   logger.info(findexc);
}
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
      logger.info(exc);
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
   var obj = getRequestData(req);
   var oid = mongojs.ObjectId(req.params.id);
   var collection = getCollection(req);

   obj.modified = Date.now();
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
 *   merge the body into the object fand set the req.body value to the
 *     merged value
 */
var fetchAndMerge = function (req, res, next) {
   var collection = getCollection(req);

   // so, still getting use to closures in here.
   // not able to return out an object, so the methodology has to be done 
   // inside.  weird to me.
   try {
      var oid = mongojs.ObjectId(req.params.id);
      var obj = getRequestData(req);
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
 * TODO: Later, May need to access the object so files are cleaned up
 */
var delItem = function (req, res, next) {
   var collection = getCollection(req);
   logger.info(req.params);
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
};

function copyFileSync(source, target) {
   try {
      var data = fs.readFileSync(source);
      logger.info(' data size read = ' + data.length);
      fs.writeFileSync(target, data);
   } catch(fswriteerr) {
      logger.info('error writing file' + fswriteerr);
   }
   logger.info("done with copy of file" + source + ' to ' + target);
};

function convertAndStoreFiles(item, collectionName) {
   var fileConfig = config.file[collectionName];

   for (var field in item) {
      logger.info(field);
      if ((item[field].name != undefined) && (item[field].path != undefined)) {
         var fileName = sanitizefn(item[field].name);
         fileName = fileName.replace(/ /g,"_");

         try {
            try {
               fs.unlinkSync(fileConfig.dir + '/' + fileName);
            } catch (removeFileErr) {
               //ignore
            }

            copyFileSync(item[field].path, fileConfig.dir + '/' + fileName);

            //fs.writecopySync(item[field].path, fileConfig.dir + '/' + fileName, {clobber: true});
         } catch (err) {
            logger.info('error copying file');
         }

         item[field] = {url: fileConfig.urlRoot + '/' + fileName, name: fileName, type: item[field].type};
         //copy the file to the new directory
         logger.info('new file will be ' + item[field].name)
      }
   }
   return item;
}


/**
 * handler to add a new item to the collection
 */
var newItem = function (req, res, next) {
logger.info('adding new item');
   var collectionName = getCollectionName(req);
   var collection = getCollection(req);
   var item = getRequestData(req);
   logger.info('adding to collection');

   //need to put in the chain of callbacks
   // here we want to move the file, and the call
   item = convertAndStoreFiles(item, collectionName);

   // append the created date to the item
   var now = Date.now();
   item.created = now;
   item.updated = now;
   collection.save(item, function (err, data) {
      logger.info("done with save of item");
      if (err) {
         res.writeHead(400, JSON_CONTENT);
         res.end(JSON.stringify(err));
      } else {
         res.writeHead(201, JSON_CONTENT);
         data = addLocationToItem(data, req);
         res.end(JSON.stringify(data));
      }
      return next();
   });
}

/**
 * This will return a function that converts all dates, files and eventually passwords into the right format
 * It is done after the validate.  So not to impose these formats onto how the user enters the data.
 * @param schema
 * @returns {Function}
 */
var convertBody = function(schema) {
   return function(req, res, next) {
      logger.info("conversion of password, date and file types");
      var obj = getRequestData();

      req.data = jsc.convert(req.data, schema);

      return next();
   };
};


/**
 * will validate to body of the request with the schema
 */
var validateBody = function (schema) {

  return function(req, res, next) {
     logger.info('validating body');
    var obj = getRequestData(req);
    var v = new sv();
    var valid = v.validateInput(obj, schema);
    if (! valid) {
       logger.info("error");
       res.writeHead(400, JSON_CONTENT);
       res.end(JSON.stringify(v.getFieldErrors()));
       return;
    }
     logger.info('validating body complete');

    return next();
  };
};

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
      var obj = getRequestData(req);
      //TODO change the check to get fields that have isPassword attribute set to true
      //TODO UNTESTED
      if (obj && obj.password) {


         passwordhasher(obj.password).hash(function(error, hash) {
            if(error)
               throw new Error('Something went wrong!');

            obj.password = hash;
            req.body = obj;
         });
      }
      return next();
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
         logger.info('adding create endpoint ' + epName);
         if (typeof config.schema === "undefined") {
            server.post(epName, newItem);
         } else {
            server.post(epName, vc, hpwd, newItem);
         }
      } else if (epType == 'R') {
         logger.info('adding read endpoint ' + epName);
         logger.info('adding read endpoint ' + epName + "/:id");
         server.get(epName, getItems);
         server.get(epName + "/:id", getItem);
      } else if (epType == 'U') {
         logger.info('adding update endpoint ' + epName + "/:id");
         server.put(epName + "/:id", fetchAndMerge, vc, updateItem);
      } else if (epType == 'D') {
         logger.info('adding delete endpoint ' + epName + "/:id");
         server.del(epName + "/:id", delItem);
      }
   }
   // adding in a schema endpoint
   logger.info('adding read endpoint ' + epName + '.schema');
   server.get(epName + '.schema', displaySchema(config.schema));
};

exports.catchAllErrors = function(req, res, next) {
   var rtn;

   try {
      rtn = next();
   } catch (exc) {
      logger.info(exc);

      res.writeHead(401, JSON_CONTENT);
      res.end(JSON.stringify(exc));
   }
   return rtn;
};

exports.parseDates = function(req, resp, next) {
   // parse out the options in body and request params and check for any dates
   // if they exist, change them into date objects

   var remapDates = function(obj) {
      if (! obj || obj == {}) return obj;

      try {
         for (var key in obj) {
            var val = obj[key];
            logger.info(typeof val);
            if (typeof val == 'object') {
               obj[key] = remapDates(val);
            } else {
               if (val == 'now()') {
                  obj[key] = new Date();
                  logger.info(' converting key ' + val + ' to now date');
               } else if (val.startsWith('Date(')) {
                  try {
                     var parts = val.split("'");
                     obj[key] = new Date(parts[1]);
                  } catch (dtErr) {
                     obj[key] = val;
                  }

               }
            }
         }
      } catch (err) {
         logger.info(err);
      }

      return obj;
   };

   req.body = remapDates(req.body);
   req.params = remapDates(req.params);

   next();
};


//TODO: This needs a lot of work.
exports.createSearchEndPoint = function(server, epconfig) {
   var entities = ['users'];
   var epName = epconfig.basePath + '/search';

   server.get(epName, function(req, res, next) {
      var item = getRequestData(req);

      var collectionName = 'users';  //TODO CHANGE THIS
      var collection = config.db.collection(collectionName);

      collection.find({}, function(err, docs) {
         res.writeHead(200, JSON_CONTENT);
         res.end(JSON.stringify(docs));
      });
   });
};
