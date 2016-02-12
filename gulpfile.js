// Node modules
var fs = require('fs'),
    vm = require('vm'),
    //merge = require('deeply'),
    chalk = require('chalk'),
    es = require('event-stream');

// Gulp and plugins
var gulp = require('gulp'),
    //rjs = require('gulp-requirejs-bundler'),
    concat = require('gulp-concat'),
    clean = require('gulp-clean'),
    gnf = require('gulp-npm-files');


gulp.task('clean', function() {
    gulp.src('./dist', {read: false})
        .pipe(clean({force:true}));
    gulp.src('./stage', {read: false})
        .pipe(clean({force:true}));

});

gulp.task('copy-dist', [], function() {
    var jsFiles = [
        'auth.js',
        'passportaccount.js',
        'schemas.js',
        'kbwebsvr.js',
        'secure-doc.js',
        'json-schema-convertor.js',
        'json-schema-validator.js',
        'restify-mep.js',
        'package.json'
    ];
    gulp.src(jsFiles)
        .pipe(gulp.dest('./dist'));
});


gulp.task('package', function() {
    var tar = require('gulp-tar');
    var gzip = require('gulp-gzip');

        gulp.src('./dist/**/*')
        .pipe(tar('kbwebsvr.tar'))
        .pipe(gzip())
        .pipe(gulp.dest('./stage/'));
});

gulp.task('ship', function(callback) {
    var GulpSSH = require('gulp-ssh')
    var privateKeyPath = process.env["HOME"] + '/.ssh/id_rsa';

    var config = {
        host: 'kbweb.steeber.net',
        port: 22,
        username: 'deployweb',
        privateKey: fs.readFileSync(privateKeyPath)
    };


    var gulpSSH = new GulpSSH({
        ignoreErrors: false,
        sshConfig: config
    });

    return gulp.src('./stage/kbwebsvr.tar.gz')
        .pipe(gulpSSH.sftp('write', '/var/web/stage/kbwebsvr.tar.gz'));

});

gulp.task('deploy', function(callback) {
    var GulpSSH = require('gulp-ssh')
    var privateKeyPath = process.env["HOME"] + '/.ssh/id_rsa';

    var config = {
        host: 'kbweb.steeber.net',
        port: 22,
        username: 'deployweb',
        privateKey: fs.readFileSync(privateKeyPath)
    };


    var gulpSSH = new GulpSSH({
        ignoreErrors: false,
        sshConfig: config
    });

    // change this to execute a tar -xzf command from the directory
    return gulpSSH.shell([
        'cd /var/web/kbwebsvr',
        'tar -czf ../stage/kbwebsvr-bak.$(date +%Y%m%d%H%M).tar.gz *.js',
        'cp kbwebsvr-env.js ../stage/.',
        'rm -rf *.js',
        'tar -xzf ../stage/kbwebsvr.tar.gz',
        'cp ../stage/kbwebsvr-env.js .',
        'npm install --only=production',
        'sleep 3;pm2 restart kbwebsvr'],
        {filePath: 'deploy.log'})
        .pipe(gulp.dest('./stage'));

});

gulp.task('restart', function(callback) {
    var GulpSSH = require('gulp-ssh')
    var privateKeyPath = process.env["HOME"] + '/.ssh/id_rsa';

    var config = {
        host: 'kbweb.steeber.net',
        port: 22,
        username: 'deployweb',
        privateKey: fs.readFileSync(privateKeyPath)
    };


    var gulpSSH = new GulpSSH({
        ignoreErrors: false,
        sshConfig: config
    });

    // change this to execute a tar -xzf command from the directory
    return gulpSSH.shell([
        'pm2 restart kbwebsvr',

        'pm2 prettylist'],
        {filePath: 'deploy.log'})
        .pipe(gulp.dest('./stage'));

});

