const gulp = require('gulp'),
      fs = require('fs'),
      hg = require('gulp-hg'),
      yaml = require('js-yaml');

var versionInfo = yaml.safeLoad(fs.readFileSync('versions.yml', 'utf8'));
var versions = Object.keys(versionInfo);

versions.forEach(function (version) {
    // Grab .md files for this version
    gulp.task('gather-unix-' + version, ['get-joe'], function(done) {
        return hg.update(versionInfo[version].tags.unix, {cwd: './joe'}, function(out, err) {
            gulp.src(['joe/README.md', 'joe/NEWS.md', 'joe/docs/man.md', 'joe/docs/hacking.md'])
                .pipe(gulp.dest('intermediate/' + version))
                .on('end', done);
        });
    });
});

gulp.task('gather-all', versions.map(function(v) { return 'gather-unix-' + v; }));

// Task to check out or update JOE.
gulp.task('get-joe', function(done) {
    if (!fs.existsSync('./joe')) {
        hg.clone('http://hg.code.sf.net/p/joe-editor/mercurial', './joe', function() { done(); });
    } else {
        hg.pull({cwd: './joe'}, function() { done(); });
    }
});

gulp.task('default', ['gather-all']);
