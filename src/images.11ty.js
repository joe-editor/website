import fs from 'node:fs';
import git from 'isomorphic-git';
import path from 'node:path';

import * as gitutils from '../lib/gitutils.js';

// Copies all images out of git main and into an img/ directory in the output.
const gitdir = gitutils.gitdir;

export default class GitImageGenerator {
    async data() {
        const oid = await git.resolveRef({ fs, gitdir, ref: "main" });
        const files = await git.listFiles({ fs, gitdir, ref: "main" });

        // Filter for all images
        const images = files.filter(f => f.match(/\.(jpg|jpeg|png|gif|svg|ico)$/i));

        let allImages = images.map(filePath => {
            return {
                oid,
                filePath,
                // Extract filename to use in permalink
                name: path.basename(filePath)
            };
        });

        return {
            pagination: {
                data: "allImages",
                size: 1,
                alias: "image"
            },
            allImages,
            permalink: (data) => `img/${data.image.name}`
        };
    }

    async render(data) {
        const { blob } = await git.readBlob({ fs, gitdir, oid: data.image.oid, filepath: data.image.filePath });
        return Buffer.from(blob);
    }
}
