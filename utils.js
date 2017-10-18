const marked = require('marked'),
      streamToArray = require('stream-to-array'),
      ejs = require('ejs'),
      gutil = require('gulp-util'),
      _ = require('lodash'),
      URI = require('urijs'),
      through = require('through2'),
      version = require('./version');

// https://github.com/mitsuruog/gulp-markdown2bootstrap/blob/master/index.js

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
        
        marked(file.contents.toString(), _.merge(markedOptions, {renderer: renderer}), (err, data) => {
            if (err) {
                return cb(err, null);
            }
            
            var vars = {
                toc: toc,
                content: data,
                versions: version,
            };
            
            templates.then((tmpl) => {
                file.contents = new Buffer(ejs.render(tmpl[0].contents.toString(), _.merge(ejsOptions, vars), {filename: tmpl[0].path}));
                file.path = gutil.replaceExtension(file.path, '.html');
                cb(null, file);
            });
        });
    });
}

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
    
    var oldImage = renderer.image.bind(renderer);
    renderer.image = (href, title, text) => {
        // Relocate all images to /img/<filename> -- assume that we have it.
        var path = URI(href).path();
        var slash = path.lastIndexOf("/");
        var newPath = "/img/" + path.substring(slash + 1);
        return oldImage(newPath, title, text);
    };
    
    var oldLink = renderer.link.bind(renderer);
    renderer.link = (href, title, text) => {
        // Assume that we've converted all the markdown files to html and they're local.
        var path = URI(href).path();
        var slash = path.lastIndexOf("/");
        var fileName = path.substring(slash + 1);
        if (_.endsWith(fileName, '.md')) {
            return oldLink(gutil.replaceExtension(fileName, '.html'), title, text);
        } else {
            return oldLink(href, title, text);
        }
    };
    
    return renderer;
}

module.exports = {
    convertmd: convertmd,
};
