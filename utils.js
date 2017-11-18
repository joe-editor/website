const marked = require('marked'),
      streamToArray = require('stream-to-array'),
      ejs = require('ejs'),
      gutil = require('gulp-util'),
      _ = require('lodash'),
      URI = require('urijs'),
      through = require('through2'),
      moment = require('moment'),
      version = require('./version');

// Inputs markdown data, accepts a template as an argument and renders to html.
function convertmd(templateStream, options) {
    var templates = streamToArray(templateStream);
    
    options = options || {};
    var markedOptions = options.marked || {};
    var ejsOptions = options.ejs || {};
    
    return through.obj((file, enc, cb) => {
        if (file.isNull()) {
            return cb(null, file);
        }
        
        if (file.isStream()) {
            return cb("Streaming not supported", null);
        }
        
        var toc = [];
        var renderer = makeRenderer(toc);
        
        // Markdown compile
        marked(file.contents.toString(), _.merge(markedOptions, {renderer: renderer}), (err, data) => {
            if (err) {
                return cb(err, null);
            }
            
            // One of the dodgier bits, I'll admit.
            var vars = {
                toc: toc,
                content: data,
                versions: version,
                current: getVersionFromPath(file.path),
                moment: moment,
            };
            
            // EJS compile
            templates.then((tmpl) => {
                file.contents = new Buffer(ejs.render(tmpl[0].contents.toString(), _.merge(ejsOptions, vars), {filename: tmpl[0].path}));
                file.path = gutil.replaceExtension(file.path, '.html');
                cb(null, file);
            });
        });
    });
}

function getVersionFromPath(path) {
    // paths are generally /foo/bar/<version>/file -- get the <version> out
    var lastSlash = path.lastIndexOf('/');
    var secondLastSlash = path.lastIndexOf('/', lastSlash - 1);
    return (lastSlash < 0 || secondLastSlash < 0) ? "" : path.substr(secondLastSlash + 1, lastSlash - secondLastSlash - 1);
}

// Builds a marked renderer to customize some of the output elements
function makeRenderer(toc) {
    var renderer = new marked.Renderer();
    
    // A lot of this was stolen from https://github.com/mitsuruog/gulp-markdown2bootstrap/blob/master/index.js
    
    renderer.blockquote = (quote) => `<blockquote><p>\n${quote}\n</p></blockquote>\n`;
    renderer.heading = (text, level, raw) => {
        var slug = raw.toLowerCase().replace(/[^\w]+/g, '-');
        toc.push({
            anchor: slug,
            level: level,
            text: raw,
        });
        
        return `<a class="anchor" id="${slug}"><h${level}><a name="${slug}" class="text-muted" href="#">${text}</h${level}></a>`;
    };
    renderer.table = (header, body) => {
        return `<table class="table table-bordered">\n<thead>\n${header}\n</thead>\n<tbody>\n${body}\n</tbody>\n</table>\n`;
    };
    
    renderer.image = (href, title, text) => {
        // Relocate all images to /img/<filename> -- assume that we have it.
        var path = URI(href).path();
        var slash = path.lastIndexOf("/");
        var newPath = "/img/" + path.substring(slash + 1);
        return `<img src="${newPath}" alt="${text}" class="img-fluid">`;
    };
    
    var oldLink = renderer.link.bind(renderer);
    renderer.link = (href, title, text) => {
        // Assume that we've converted all the markdown files to html and they're local.
        var path = URI(href).path();
        var slash = path.lastIndexOf("/");
        var fileName = path.substring(slash + 1);
        if (_.endsWith(fileName, '.md')) {
            var translated = translateLink(fileName);
            if (translated) {
                return oldLink(translated, title, text);
            }
        }
        
        return oldLink(href, title, text);
    };
    
    return renderer;
}

// Translates links to .md files (usually pointing into the mercurial tree)
// to links within *this* site, if possible
function translateLink(filename) {
    return gutil.replaceExtension(filename, '.html');
}

// Strips out [TOC] from documents
function stripTOC() {
    return through.obj((file, enc, cb) => {
        const st = '[TOC]';
        var buf = file.contents;
        
        var start = buf.indexOf(st), end = -1;
        if (start < 0) {
            return cb(null, file);
        }
        
        // Also remove all whitespace after [TOC]
        for (end = start + st.length; /\s/.test(String.fromCharCode(buf[end])); end++) {}
        
        // Splice out [TOC]
        file.contents = Buffer.concat([buf.slice(0, start), buf.slice(end)]);
        return cb(null, file);
    });
}

// Extracts only sections related to the version found in the file path.
function extractVersionChanges() {
    return through.obj((file, enc, cb) => {
        var ver = getVersionFromPath(file.path);
        var output = [];
        let reading = false;
        
        file.contents.toString().split("\n").forEach(line => {
            if (_.startsWith(line, "### ")) {
                var idx = line.indexOf(ver);
                if (idx > 0 && /\s|v/.test(line.charAt(idx - 1))) {
                    reading = true;
                } else {
                    reading = false;
                }
            }
            
            if (reading) {
                output.push(line);
            }
        });
        
        file.contents = Buffer.from(output.join("\n"));
        return cb(null, file);
    });
}

module.exports = {
    convertmd: convertmd,
    stripTOC: stripTOC,
    extractVersionChanges: extractVersionChanges,
};
