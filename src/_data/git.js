import fs from 'node:fs/promises';
import nodefs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';

const REMOTE = "https://github.com/joe-editor/joe.git";
const GITPATH = '../../joe-git';

export default async function() {
    const fileDir = path.dirname(fileURLToPath(import.meta.url));
    const dir = path.resolve(fileDir, GITPATH);

    if (!await checkPath(dir)) {
        console.log(await git.clone({ fs: nodefs, http, dir, url: REMOTE }));
    }

    return {
        read: async function(ref, filepath) {
            const oid = await git.resolveRef({ fs: nodefs, dir, ref });
            const { blob } = await git.readBlob({ fs: nodefs, dir, filepath, oid });
            const str = Buffer.from(blob).toString('utf-8');
            return str;
        },
        readFirst: async function(ref, filepaths) {
            const oid = await git.resolveRef({ fs: nodefs, dir, ref });
            let lastError = null;

            for (let i = 0; i < filepaths.length; i++) {
                try {
                    const { blob } = await git.readBlob({ fs: nodefs, dir, filepath: filepaths[i], oid });
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

async function checkPath(p) {
    let isdir = false;
    try {
        let st = await fs.stat(gitPath);
        isdir = st.isDirectory();
    } catch (err) {
        return false;
    }

    if (!isdir) {
        throw "Path exists but is not a directory";
    }

    return isdir;
}
