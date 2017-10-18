const fs = require('fs'),
      yaml = require('js-yaml');

var versionInfo = yaml.safeLoad(fs.readFileSync('versions.yml', 'utf8'));

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

var versions = Object.keys(versionInfo);
versions.sort(vcmp);
versions.reverse();

const version = {
    versions: versions,
    info: versionInfo,
    latest: versions[0],
    hasWindows: function(v) {
        return this.info[v].tags && this.info[v].tags.windows;
    },
    hasUnix: function(v) {
        return this.info[v].tags && this.info[v].tags.unix;
    },
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

module.exports = version;
