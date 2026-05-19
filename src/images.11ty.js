import fs from 'node:fs';
import git from 'isomorphic-git';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const GITPATH = '../joe-git';
const fileDir = path.dirname(fileURLToPath(import.meta.url));
const dir = path.resolve(fileDir, GITPATH);

// Copies all images out of git main and into an img/ directory in the output.

export default class GitImageGenerator {
    async data() {
        const oid = await git.resolveRef({ fs, dir, ref: "main" });
        const files = await git.listFiles({ fs, dir, oid });

        // Filter for all images
        const images = files.filter(f => f.match(/\.(jpg|jpeg|png|gif|svg)$/i));

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
        const { blob } = await git.readBlob({ fs, dir, oid: data.image.oid, filepath: data.image.filePath });
        return Buffer.from(blob);
    }
}
