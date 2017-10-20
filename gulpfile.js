const gulp = require('gulp'),
      fs = require('fs'),
      hg = require('gulp-hg'),
      version = require('./version'),
      lock = require('gulp-lock'),
      rename = require('gulp-rename'),
      yarn = require('gulp-yarn'),
      inject = require('gulp-inject'),
      filter = require('gulp-filter'),
      utils = require('./utils');

const theme = 'flatly'; // Bootswatch theme

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
    return hg.update('default', {cwd: './joe'}, (out, err) => {
        gulp.src(['joe/README.md', 'joe/NEWS.md', 'joe/docs/man.md', 'joe/docs/hacking.md', 'joe/docs/history.md'])
            .pipe(gulp.dest('intermediate/md/tip/'))
            .on('end', done);
    });
}));

// Depend on all gather-* tasks above.
gulp.task('gather', version.versions.map((v) => 'gather-unix-' + v).concat(version.versions.map((v) => 'gather-windows-' + v)));

// Render all man.md's with marked against templates/manual.ejs --> put in intermediate/dist/<version>/man.html
gulp.task('md:manuals', ['gather'], () => {
    return gulp.src(['intermediate/md/**/man.md'], {base: './intermediate/md'})
               .pipe(utils.stripTOC())
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
    return gulp.src(['intermediate/md/**/NEWS.md', '!intermediate/md/tip/**/*'], {base: './intermediate/md'})
               .pipe(utils.extractVersionChanges())
               .pipe(utils.convertmd(gulp.src('templates/release.ejs')))
               .pipe(rename({basename: "index"}))
               .pipe(gulp.dest('intermediate/dist'));
});

// Render hacking guide for the tip version --> put in intermediate/dist/hacking.html
gulp.task('md:hacking', ['gather-tip'], () => {
    return gulp.src(['intermediate/md/tip/hacking.md'])
               .pipe(utils.stripTOC())
               .pipe(utils.convertmd(gulp.src('templates/hacking.ejs')))
               .pipe(gulp.dest('intermediate/dist'));
});

gulp.task('md:history', ['gather-tip'], () => {
    return gulp.src(['intermediate/md/tip/history.md'])
               .pipe(utils.convertmd(gulp.src('templates/history.ejs')))
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
gulp.task('markdown', ['md:manuals', 'md:news', 'md:releases', 'md:hacking', 'md:history', 'md:index']);

// Copies JS bower dependencies to dist
gulp.task('deps:js', () => {
    return gulp.src(["node_modules/jquery/dist/jquery.min.js", 
                     "node_modules/bootstrap/dist/js/bootstrap.min.js",
                     "node_modules/tether/dist/js/tether.min.js"])
               .pipe(gulp.dest('./dist/js'));
});

// Copies CSS bower dependencies to dist
gulp.task('deps:css', () => {
    return gulp.src([`node_modules/bootswatch/${theme}/bootstrap.min.css`])
//    return gulp.src([`node_modules/bootstrap/dist/css/bootstrap.min.css`]) // Default theme
               .pipe(gulp.dest('./dist/css'));
});

// All bower tasks
gulp.task('deps', ['deps:css', 'deps:js']);

// Injects bower files from templatized html files --> put the results in ./dist
gulp.task('inject', ['deps', 'markdown'], () => {
    const ignorePaths = ["intermediate/dist", "dist"];
    
    return gulp.src(['intermediate/dist/**/*.html'], {base: 'intermediate/dist'})
               // Make sure jQuery comes first.  Otherwise, this breaks.
               .pipe(inject(gulp.src('./dist/js/jquery.min.js', {read: false}), {starttag: '<!-- inject:jquery:{{ext}} -->', ignorePath: ignorePaths})) // Make sure jquery comes first
               .pipe(inject(gulp.src(['./dist/js/*.js', '!./dist/js/jquery.min.js'], {read: false}), {ignorePath: ignorePaths}))
               .pipe(inject(gulp.src('./dist/css/*.css', {read: false}), {ignorePath: ignorePaths}))
               .pipe(gulp.dest('./dist'));
});

// Task that copies images from img --> dist/img
gulp.task('images', () => {
    return gulp.src(['img/*'], {read: true}).pipe(gulp.dest('dist/img'));
});

gulp.task('default', ['markdown', 'inject', 'images']);
