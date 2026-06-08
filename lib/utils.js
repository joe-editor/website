import moment from 'moment';
import URI from 'urijs';
import _ from 'lodash';
import path from 'path';


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

        return `<h${level} id="${slug}" class="nav-target"><a name="${slug}" class="text-muted" href="#${slug}">${text}</a></h${level}>`;
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
        return oldLink(translateLink(href), title, text);
    };

    return renderer;
}

// Translates links to .md files (usually pointing into the mercurial tree)
// to links within *this* site, if possible
export function translateLink(href) {
    var uri = URI(href);
    var path = uri.path();
    var slash = path.lastIndexOf("/");
    var fileName = path.substring(slash + 1);
    if (_.endsWith(fileName, '.md')) {
        if (uri.hostname() && uri.hostname().indexOf('sourceforge') < 0) {
            return href;
        }

        uri = uri.hostname(null).protocol(null);

        if (fileName === "README.md") {
            return uri.path('/index.html').toString();
        } else {
            return uri.path(replaceExtension(fileName, '.html')).toString();
        }
    }

    return href;
}

function replaceExtension(filename, newext) {
    const ext = path.extname(filename);
    return ext.slice(0, filename.length - ext.length) + newext;
}

