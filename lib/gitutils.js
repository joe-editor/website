import fs from 'node:fs/promises';
import nodefs from 'node:fs';
import path from 'node:path';
import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import { fileURLToPath } from 'node:url';

const REMOTE = "https://github.com/joe-editor/joe.git";
const GITPATH = '../joe-git'; // relative to this file.

const FETCH_PERIOD = 10*60*1000; // 10 minutes between fetches

const fileDir = path.dirname(fileURLToPath(import.meta.url));
const repoDir = path.resolve(fileDir, GITPATH);

export const dir = repoDir;

let lastPull = 0;

export async function initRepo({dir, runMode, outputMode}) {
    if (!await checkPath(repoDir) || !await checkRepo()) {
        // Clone.
        console.log(`Cloning into ${REMOTE}...`);

        await git.clone({
            fs: nodefs,
            http,
            dir: repoDir,
            url: REMOTE,
            noCheckout: true,
        });

        await git.setConfig({
            fs: nodefs,
            dir: repoDir,
            path: 'core.bare',
            value: true,
        });

        console.log("Clone complete.");
        lastPull = new Date().getTime();
    } else {
        // Check last pull time.
        if (await getLastSyncTimeAgo(repoDir) < FETCH_PERIOD) {
            return;
        } else {
            await touchRepo(repoDir);
        }

        // Fetch.
        console.log(`Pulling repo updates from ${REMOTE}...`);
        await git.fetch({
            fs: nodefs,
            http,
            dir: repoDir,
            url: REMOTE,
            remote: 'origin',
            tags: true,
        });

        console.log("Repo synced.");
    }
}

async function checkPath(p) {
    let isdir = false;
    try {
        let st = await fs.stat(p);
        isdir = st.isDirectory();
    } catch (err) {
        return false;
    }

    if (!isdir) {
        throw "Path exists but is not a directory";
    }

    return isdir;
}

async function checkRepo() {
    try {
        await git.resolveRef({ fs: nodefs, dir: repoDir, ref: 'HEAD' });
        return true;
    } catch (err) {
        return false;
    }
}

async function touchRepo(p) {
    let now = (new Date().getTime() / 1000) >> 0;
    await fs.utimes(p, now, now);
}

async function getLastSyncTimeAgo(p) {
    let mtime = (await fs.stat(p)).mtimeMs;
    return new Date().getTime() - mtime;
}
