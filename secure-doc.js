var fs = require('fs');
var restify = require('restify');

var JSON_CONTENT = {'Content-Type': 'application/json; charset=utf-8'};



var SecureDoc = function(rootDir) {

    var self = this;

    self.rootDir = rootDir;

    self.checkAuthenticated = function(req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        return next(new restify.InvalidCredentialsError("Please check your details and try again."));
    };

    self.listDirectory = function(req, res, next) {
        var dir =  self.rootDir + '/secure-docs/' + req.params.dir;

        var dirList = fs.readdirSync(dir);

        var dirList = dirList.map(function(item, inx) {
            var st = fs.statSync(dir + '/' + item);

            //TODO Change later if we care
            var ctime = st.ctime.toDateString();
            var mtime = st.mtime.toDateString();


            return {name: item, created: ctime, modified: mtime};
        });

        res.writeHead(200, JSON_CONTENT);
        res.end(JSON.stringify(dirList));

    };


    self.createEndPoints = function(server) {
        server.get("/secure-docs/:dir/:filename", self.checkAuthenticated,
            restify.serveStatic({
                directory: self.rootDir
            }));

        server.get("/secure-docs/:dir", self.checkAuthenticated, self.listDirectory);
        server.get("/secure-docs/:dir/", self.checkAuthenticated, self.listDirectory);

    };
};




module.exports = SecureDoc;