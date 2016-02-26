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

//TODO:  might change the config based on where I want to deploy to
var SSH_CONFIG = {
    host: 'new.kenoshabowmen.com',
    port: 22,
    username: 'kbweb',
    privateKey: fs.readFileSync(process.env["HOME"] + '/.ssh/id_rsa')
};


gulp.task('clean', function() {
    return gulp.src(['./dist', './stage'], {read: false})
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
        'restify-ical.js',
        'package.json',
        'google-generated-creds.json',
        'load-user.js',
        'load-announcements.js',
        'forgotpwdjob.js'
    ];
    return gulp.src(jsFiles)
        .pipe(gulp.dest('./dist'));

});

gulp.task('copy-config', [], function() {
    var jsFiles = [
        'config/*.*'
    ];
    return gulp.src(jsFiles)
        .pipe(gulp.dest('./dist/config'));

});



gulp.task('package', ['copy-dist','copy-config'], function() {
    var tar = require('gulp-tar');
    var gzip = require('gulp-gzip');

    return gulp.src('./dist/**/*')
        .pipe(tar('kbwebsvr.tar'))
        .pipe(gzip())
        .pipe(gulp.dest('./stage/'));
});

gulp.task('ship', function() {
    var GulpSSH = require('gulp-ssh')

    var gulpSSH = new GulpSSH({
        ignoreErrors: false,
        sshConfig: SSH_CONFIG
    });

    return gulp.src('./stage/kbwebsvr.tar.gz')
        .pipe(gulpSSH.sftp('write', '/opt/web/stage/kbwebsvr.tar.gz'));

});

gulp.task('deploy', function(callback) {
    var GulpSSH = require('gulp-ssh')

    var gulpSSH = new GulpSSH({
        ignoreErrors: false,
        sshConfig: SSH_CONFIG
    });

    // change this to execute a tar -xzf command from the directory
    return gulpSSH.shell([
            'cd /opt/web/kbwebsvr',
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

gulp.task('status', function(callback) {
    var GulpSSH = require('gulp-ssh')

    var gulpSSH = new GulpSSH({
        ignoreErrors: false,
        sshConfig: SSH_CONFIG
    });

    // change this to execute a tar -xzf command from the directory
    return gulpSSH.shell([
            'pm2 list'],
        {filePath: 'status.log'})
        .pipe(gulp.dest('./stage'));

});

gulp.task('restart', function(callback) {
    var GulpSSH = require('gulp-ssh')

    var gulpSSH = new GulpSSH({
        ignoreErrors: false,
        sshConfig: SSH_CONFIG
    });

    // change this to execute a tar -xzf command from the directory
    return gulpSSH.shell([
            'pm2 restart kbwebsvr',

            'pm2 prettylist'],
        {filePath: 'deploy.log'})
        .pipe(gulp.dest('./stage'));

});
