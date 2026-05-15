import * as fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import * as path from 'node:path';
import * as yaml from 'js-yaml';

const FILENAME = '../../versions.yml';

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

export default async function() {
    const dir = path.dirname(fileURLToPath(import.meta.url));
    const file = path.resolve(dir, FILENAME);
    var versionInfo = yaml.load(await fs.readFile(file, 'utf8'));

    var versions = Object.keys(versionInfo);
    versions.sort(vcmp);
    versions.reverse();

    let version = {};
    version.versions = versions;
    version.info = versionInfo;
    version.latest = versions[0];

    version.hasWindows = function(v) {
        return this.info[v].git && this.info[v].git.windows;
    };

    version.hasUnix = function(v) {
        return this.info[v].git && this.info[v].git.unix;
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
