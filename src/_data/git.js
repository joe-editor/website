import fs from 'node:fs';
import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';

import * as gitutils from '../../lib/gitutils.js';

export default async function() {
    const gitdir = gitutils.gitdir;
    const cache = {};

    return {
        read: async function(ref, filepath) {
            const oid = await git.resolveRef({ fs, gitdir, ref, cache });
            const { blob } = await git.readBlob({ fs, gitdir, filepath, oid, cache });
            const str = Buffer.from(blob).toString('utf-8');
            return str;
        },
        readFirst: async function(ref, filepaths) {
            const oid = await git.resolveRef({ fs, gitdir, ref, cache });
            let lastError = null;

            for (let i = 0; i < filepaths.length; i++) {
                try {
                    const { blob } = await git.readBlob({ fs, gitdir, filepath: filepaths[i], oid, cache });
                    return Buffer.from(blob).toString('utf-8');
                } catch (e) {
                    lastError = e;
                }
            }

            // If none are found then throw the last error.
            throw lastError;
        },
    };
}
