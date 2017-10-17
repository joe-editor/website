const gulp = require('gulp'),
      fs = require('fs'),
      hg = require('gulp-hg'),
      version = require('./version'),
      lock = require('gulp-lock'),
      utils = require('./utils');

var hgLock = lock();

version.versions.forEach(function (v) {
    // Grab .md files for this version --> put them in intermediate/md/<version>
    gulp.task('gather-unix-' + v, ['get-joe'], hgLock.cb((done) => {
        if (!version.hasUnix(v)) {
          return done();
        }
        
        return hg.update(version.info[v].tags.unix, {cwd: './joe'}, function(out, err) {
            gulp.src(['joe/README.md', 'joe/NEWS.md', 'joe/docs/man.md', 'joe/docs/hacking.md'])
                .pipe(gulp.dest('intermediate/md/' + v))
                .on('end', done);
        });
    }));
    
    // Grab windows.md for this version --> put in same place as above
    gulp.task('gather-windows-' + v, hgLock.cb((done) => {
        if (!version.hasWindows(v)) {
            // No windows version every release.
            return done();
        }
        
        return hg.update(version.info[v].tags.windows, {cwd: './joe'}, function(out, err) {
            gulp.src(['joe/docs/windows.md'])
                .pipe(gulp.dest('intermediate/md/' + v))
                .on('end', done);
        });
    }));
});

// Depend on all gather-* tasks above.
gulp.task('gather', version.versions.map((v) => 'gather-unix-' + v).concat(version.versions.map((v) => 'gather-windows-' + v)));

// Render man.md with marked against manual.mustache --> put in intermediate/dist/<version>/man.md.html
gulp.task('manuals', ['gather'], function() {
    return gulp.src(['intermediate/md/**/man.md'], {base: './intermediate/md'})
               .pipe(utils.convertmd(gulp.src('templates/manual.ejs'), {
                       ejs: {
                           versions: version.stache,
                       },
                   }))
               .pipe(gulp.dest('intermediate/dist'));
});

// Render news.md with marked against news.mustache --> put in intermediate/dist/<version>/news.md.html
gulp.task('news', ['gather'], function() {
    
});

// Task to check out or update JOE from Mercurial
gulp.task('get-joe', function(done) {
    if (!fs.existsSync('./joe')) {
        hg.clone('http://hg.code.sf.net/p/joe-editor/mercurial', './joe', function() { done(); });
    } else {
        hg.pull({cwd: './joe'}, function() { done(); });
    }
});

gulp.task('default', ['manuals']);
