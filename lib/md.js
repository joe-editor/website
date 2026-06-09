import path from 'path';
import _ from 'lodash';
import markdownIt from 'markdown-it';
import URI from 'urijs';

export function makeRenderer(toc) {
    const md = markdownIt({ html: true, linkify: true });
    const rules = md.renderer.rules;

    rules.blockquote_open = () => '<blockquote><p>\n';
    rules.blockquote_close = () => '</p></blockquote>\n';

    rules.heading_open = (tokens, idx, options, env, self) => {
        const token = tokens[idx];
        const level = token.tag.slice(1); // h1 -> 1

        // Get the content of the next token (the text node)
        const text = tokens[idx + 1].content;
        const slug = text.toLowerCase().replace(/[^\w]+/g, '-');

        // Push TOC array
        toc.push({
            anchor: slug,
            level: parseInt(level),
            text: text
        });

        return `<h${level} id="${slug}" class="nav-target"><a name="${slug}" class="text-muted" href="#${slug}">`;
    };

    rules.heading_close = (tokens, idx) => `</a></h${tokens[idx].tag.slice(1)}>`;
    rules.table_open = () => `<table class="table table-bordered">\n`;
    rules.image = (tokens, idx, options, env, self) => {
        const token = tokens[idx];
        const srcIndex = token.attrIndex('src');
        const originalHref = token.attrs[srcIndex][1];

        // Logic to get just the filename
        const filename = path.basename(originalHref);
        const newPath = "/img/" + filename;

        token.attrs[srcIndex][1] = newPath; // Update src
        token.attrPush(['class', 'img-fluid']); // Add bootstrap class

        return self.renderToken(tokens, idx, options);
    };

    const defaultLinkOpen = rules.link_open || function(tokens, idx, options, env, self) {
        return self.renderToken(tokens, idx, options);
    };

    rules.link_open = (tokens, idx, options, env, self) => {
        const aIndex = tokens[idx].attrIndex('href');
        if (aIndex >= 0) {
            tokens[idx].attrs[aIndex][1] = translateLink(tokens[idx].attrs[aIndex][1]);
        }
        return defaultLinkOpen(tokens, idx, options, env, self);
    };

    return md;
}

export function render(content, toc) {
    if (typeof toc === 'undefined') {
        toc = [];
    }

    let md = makeRenderer(toc);
    return md.render(content);
}

// Strips out [TOC] from documents
export function stripTOC(contents) {
    const st = '[TOC]';

    var start = contents.indexOf(st), end = -1;
    if (start < 0) {
        return contents;
    }

    // Also remove all whitespace after [TOC]
    for (end = start + st.length; /\s/.test(String.fromCharCode(contents[end])); end++) {}

    // Splice out [TOC]
    return contents.slice(0, start) + contents.slice(end);
}

export function extractVersionChanges(ver, contents) {
    var output = [];
    let reading = false;

    contents.split("\n").forEach(line => {
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

    return output.join("\n");
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
