const fs = require('fs'),
      yaml = require('js-yaml');

function vcmp(x, y) {
    var xparts = x.split(".");
    var yparts = y.split(".");
    
    for (var i = 0; i < Math.min(xparts.length, yparts.length); i++) {
        if (parseInt(xparts[i]) < parseInt(yparts[i])) {
            return -1;
        } else if (parseInt(xparts[i]) > parseInt(yparts[i])) {
            return 1;
        }
    }
    
    if (x.length < y.length) {
        return -1;
    } else if (x.length > y.length) {
        return 1;
    } else {
        return 0;
    }
}

function load(file, version) {
    var versionInfo = yaml.safeLoad(fs.readFileSync(file, 'utf8'));

    var versions = Object.keys(versionInfo);
    versions.sort(vcmp);
    versions.reverse();

    version.versions = versions;
    version.info = versionInfo;
    version.latest = versions[0];
    
    version.hasWindows = function(v) {
        return this.info[v].tags && this.info[v].tags.windows;
    };
    
    version.hasUnix = function(v) {
        return this.info[v].tags && this.info[v].tags.unix;
    };
    
    version.newerWindows = function(v) {
        /* Find a Windows release newer than this one */
        for (var i = versions.length - 1; i >= 0; i--) {
            if (vcmp(versions[i], v) > 0 && version.hasWindows(versions[i])) {
                return versions[i];
            }
        }
    };

    for (var i = 0; i < versions.length; i++) {
        if (version.hasUnix(versions[i])) {
            version.latestUnix = versions[i];
            break;
        }
    }

    for (var i = 0; i < versions.length; i++) {
        if (version.hasWindows(versions[i])) {
            version.latestWindows = versions[i];
            break;
        }
    }
    
    version.reload = function() { load(file, version); };
    
    return version;
}

module.exports = load('versions.yml', {});
