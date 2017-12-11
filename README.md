# Joe's Own Editor website builder

This repository contains the code necessary to build a bootstrap based
website for [Joe's Own Editor](https://sf.net/p/joe-editor).  It generates
html from templates, and uses markdown found in the JOE Mercurial repository
to generate information for releases, copies of the manual, and more.  The
important dependent packages are:

* [Bootstrap version 4 alpha 6](https://v4-alpha.getbootstrap.com/) -
  Frontend framework
* [bootswatch](https://bootswatch.com/) - Bootstrap themes
* [marked](https://github.com/chjj/marked) - Markdown parser
* [gulp](https://gulpjs.com/) - Build system
* [ejs](http://ejs.co/) - Templating engine
* [gulp-inject](https://www.npmjs.com/package/gulp-inject) - Injects
  referenced assets into html.
* [tocbot](https://github.com/tscanlin/tocbot/) - For responsive tables
  of contents on manual, hacking, and install instructions pages.

## Usage

### Pre-setup

Install [Node.js](https://nodejs.org/en/) with
[nvm](https://github.com/creationix/nvm).  Then install `gulp-cli` globally.

```sh
	% nvm install v8.7.0
	% npm install -g gulp-cli
```

### Regular maintenance

```sh
	# Install remote npm packages
	% npm install

	# Build
	% gulp

	# Build with dev-server (listens on port 3000, automatically
	# rebuilds and refreshes browsers when file changes are detected).
	% gulp dev
```

The full output goes to `dist/` when built.

## Release management

The `versions.yml` file specifies releases, download links, and hg commits. 
When a new release is added, start by adding it there, and then rerunning
`gulp` as above.  Output is found in `dist/`.
