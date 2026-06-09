import { RenderPlugin } from "@11ty/eleventy";
import ejsPlugin from "@11ty/eleventy-plugin-ejs";
import * as sass from "sass";
import path from "node:path";
import fs from "node:fs";
import { createRequire } from "node:module";
import moment from "moment";

import * as gitutils from './lib/gitutils.js';
import * as md from './lib/md.js';

const require = createRequire(import.meta.url);

export default async function(eleventyConfig) {
  // Serve on a public interface if --public is specified
  if (process.argv.includes("--public")) {
    console.log("Listening on 0.0.0.0 instead.");
    eleventyConfig.setServerOptions({
      host: "0.0.0.0",
    });
  }

  // Plugins
  eleventyConfig.addPlugin(ejsPlugin, { async: true });
  eleventyConfig.addPlugin(RenderPlugin);
  eleventyConfig.addBundle("css");
  eleventyConfig.addBundle("js");

  // Filters, data
  eleventyConfig.addGlobalData("md", () => md.render);
  eleventyConfig.addGlobalData("formatTime", () => (data, fmt) => moment.utc(data).format(fmt));
  eleventyConfig.addGlobalData("extractVersionChanges", () => md.extractVersionChanges);
  eleventyConfig.addFilter("stripTOC", md.stripTOC);

  // Sass Processing
  eleventyConfig.addTemplateFormats("scss");
  eleventyConfig.addExtension("scss", {
    outputFileExtension: "css",
    compile: async function(inputContent, inputPath) {
      return async () => {
        let result = sass.compileString(inputContent, {
          loadPaths: [path.dirname(inputPath), "node_modules"],
        });
        return result.css;
      };
    },
  });

  // Asset Passthrough
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy({
    "node_modules/bootstrap/dist/js/bootstrap.bundle.min.js": "js/bootstrap.bundle.min.js",
    "node_modules/tocbot/dist/tocbot.min.js": "js/tocbot.min.js",
    "img/favicon.ico": "img/favicon.ico",
  });

  // Initialize git
  eleventyConfig.on("eleventy.before", gitutils.initRepo);

  return {
    dir: {
      input: "src",
      output: "_site",
      data: "_data",
      includes: "_includes"
    }
  };
};
