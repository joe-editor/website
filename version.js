const fs = require('fs'),
      yaml = require('js-yaml');

var versionInfo = yaml.safeLoad(fs.readFileSync('versions.yml', 'utf8'));

function vcmp(x, y) {
    var xparts = x.split(".");
    var yparts = y.split(".");
    
    for (var i = 0; i < Math.min(xparts.length, yparts.length); i++) {
        if (parseInt(x) < parseInt(y)) {
            return -1;
        } else if (parseInt(x) > parseInt(y)) {
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

var stache = versions.map(function(v) {
    return {
        version: v,
        info: versionInfo[v],
    };
});

const version = {
    versions: versions,
    info: versionInfo,
    latest: versions[0],
    stache: stache,
    hasWindows: function(v) {
        return this.info[v].tags && this.info[v].tags.windows;
    },
    hasUnix: function(v) {
        return this.info[v].tags && this.info[v].tags.unix;
    },
};

module.exports = version;
