# Joe's Own Editor website builder

This repository contains the code necessary to build a bootstrap based
website for [Joe's Own Editor](https://sf.net/p/joe-editor). It generates
html from templates, and uses markdown found in the JOE Git repository
to generate information for releases, copies of the manual, and more. The
important dependent packages are:

* [11ty/Build Awesome](https://www.11ty.dev/) - Static-site generator
* [Bootstrap version 5.3.8](https://getbootstrap.com/) -
  Frontend framework
* [bootswatch](https://bootswatch.com/) - Bootstrap themes (`flatly`)
* [markdown-it](https://markdown-it.github.io/) - Markdown parser
* [ejs](http://ejs.co/) - Templating engine
* [tocbot](https://github.com/tscanlin/tocbot/) - For responsive tables
  of contents on manual, hacking, and install instructions pages.
* [isomorphic-git](https://isomorphic-git.org/) - Javascript Git
  implementation for reading files directly from the Git object store.
* [sass](https://sass-lang.com/) - CSS compiler

## Usage

### Pre-setup

Install [Node.js](https://nodejs.org/en/) with
[nvm](https://github.com/creationix/nvm).  Then install `gulp-cli` globally.

```sh
	% nvm install v25.6.0
```

### Regular maintenance

```sh
	# Install remote npm packages
	% npm install

	# Generate the site once
	% npm run build

	# Run a dev-server that watches files and builds automatically
	% npm run dev

	# Run a dev-server like above but listening on 0.0.0.0
	% npm run dev:public
```

The full output is written to `_site/` when built.  The JOE git repo is
cloned to a bare repo at `joe-git/` if it doesn't exist and periodically
pulled.  Markdowns are pulled from release tags in that repository.

## Release management

The `versions.yml` file specifies releases, download links, and release tags 
When a new release is added, start by adding it there, and then rerunning
`npm run build` as above.

`./publish.sh` automates building the site and rsync'ing it to SourceForge.
