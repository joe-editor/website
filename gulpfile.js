const gulp = require('gulp'),
      fs = require('fs'),
      hg = require('gulp-hg'),
      version = require('./version'),
      lock = require('gulp-lock'),
      rename = require('gulp-rename'),
      bower = require('gulp-bower'),
      mainBowerFiles = require('main-bower-files'),
      inject = require('gulp-inject'),
      filter = require('gulp-filter'),
      utils = require('./utils');

// Lock for tasks that use the Mercurial repository
var hgLock = lock();

// Task to check out or update JOE from Mercurial
gulp.task('get-joe', function(done) {
    if (!fs.existsSync('./joe')) {
        hg.clone('http://hg.code.sf.net/p/joe-editor/mercurial', './joe', function() { done(); });
    } else {
        hg.pull({cwd: './joe'}, function() { done(); });
    }
});

// Gather each version by checking out repo to the commit listed in versions.yml,
// then copying markdown files into intermediate/md
version.versions.forEach(function (v) {
    // Grab .md files for this version --> put them in intermediate/md/<version>
    gulp.task('gather-unix-' + v, ['get-joe'], hgLock.cb((done) => {
        if (!version.hasUnix(v)) {
          return done();
        }
        
        return hg.update(version.info[v].tags.unix, {cwd: './joe'}, (out, err) => {
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
        
        return hg.update(version.info[v].tags.windows, {cwd: './joe'}, (out, err) => {
            gulp.src(['joe/docs/windows.md'])
                .pipe(gulp.dest('intermediate/md/' + v))
                .on('end', done);
        });
    }));
});

// Get documents at the tip version (for changelog and README)
gulp.task('gather-tip', hgLock.cb((done) => {
    return hg.update({cwd: './joe'}, (out, err) => {
        gulp.src(['joe/README.md', 'joe/NEWS.md', 'joe/docs/man.md', 'joe/docs/hacking.md'])
            .pipe(gulp.dest('intermediate/md/tip/'))
            .on('end', done);
    });
}));

// Depend on all gather-* tasks above.
gulp.task('gather', version.versions.map((v) => 'gather-unix-' + v).concat(version.versions.map((v) => 'gather-windows-' + v)));

// Render all man.md's with marked against templates/manual.ejs --> put in intermediate/dist/<version>/man.html
gulp.task('md:manuals', ['gather'], () => {
    return gulp.src(['intermediate/md/**/man.md'], {base: './intermediate/md'})
               .pipe(utils.convertmd(gulp.src('templates/manual.ejs')))
               .pipe(gulp.dest('intermediate/dist'));
});

// Render news.md with marked against news.mustache --> put in intermediate/dist/<version>/NEWS.html
gulp.task('md:news', ['gather-tip'], () => {
    return gulp.src(['intermediate/md/tip/NEWS.md'])
               .pipe(utils.convertmd(gulp.src('templates/news.ejs')))
               .pipe(gulp.dest('intermediate/dist'));
});

// Render news.md for each version, splitting out only that version's changes --> put in intermediate/dist/<version>/index.html
gulp.task('md:releases', ['gather'], () => {
    return gulp.src(['intermediate/md/**/NEWS.md'], {base: './intermediate/md'})
               .pipe(utils.convertmd(gulp.src('templates/release.ejs')))
               .pipe(rename({basename: "index"}))
               .pipe(gulp.dest('intermediate/dist'));
});

// Render hacking guide for the tip version --> put in intermediate/dist/hacking.html
gulp.task('md:hacking', ['gather-tip'], () => {
    return gulp.src(['intermediate/md/tip/hacking.md'])
               .pipe(utils.convertmd(gulp.src('templates/hacking.ejs')))
               .pipe(gulp.dest('intermediate/dist'));
});

// Render index from the tip's README --> put in intermediate/dist/index.html
gulp.task('md:index', ['gather-tip'], () => {
    return gulp.src(['intermediate/md/tip/README.md'])
               .pipe(utils.convertmd(gulp.src('templates/index.ejs')))
               .pipe(rename("index.html"))
               .pipe(gulp.dest('intermediate/dist'));
});

// Task that groups all markdown conversion
gulp.task('markdown', ['md:manuals', 'md:news', 'md:releases', 'md:hacking', 'md:index']);

// Gets bower dependencies
gulp.task('bower:get', () => {
    return bower();
});

// Copies JS bower dependencies to dist
gulp.task('bower:js', ['bower:get'], () => {
    return gulp.src(mainBowerFiles())
               .pipe(filter(['**/*.js']))
               .pipe(gulp.dest('./dist/js'));
});

// Copies CSS bower dependencies to dist
gulp.task('bower:css', ['bower:get'], () => {
    return gulp.src(mainBowerFiles())
               .pipe(filter('**/*.css'))
               .pipe(gulp.dest('./dist/css'));
});

// All bower tasks
gulp.task('bower', ['bower:css', 'bower:js']);

// Injects bower files from templatized html files --> put the results in ./dist
gulp.task('inject', ['bower', 'markdown'], () => {
    return gulp.src(['intermediate/dist/**/*.html'], {base: 'intermediate/dist'})
               .pipe(inject(gulp.src(['./dist/js/*.js'], {read: false, base: './dist'})))
               .pipe(gulp.dest('./dist'));
});

// Task that copies images from img --> dist/img
gulp.task('images', () => {
    return gulp.src(['img/*'], {read: false}).pipe(gulp.dest('dist'));
});

gulp.task('default', ['markdown', 'inject']);
