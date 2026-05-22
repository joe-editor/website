import { RenderPlugin } from "@11ty/eleventy";
import ejsPlugin from "@11ty/eleventy-plugin-ejs";
import markdownIt from "markdown-it";
import * as sass from "sass";
import path from "node:path";
import fs from "node:fs";
import { createRequire } from "node:module";
import moment from "moment";

import * as utils from './lib/utils.js';
import * as gitutils from './lib/gitutils.js';

const require = createRequire(import.meta.url);

export default async function(eleventyConfig) {
  // Plugins
  eleventyConfig.addPlugin(ejsPlugin, { async: true });
  eleventyConfig.addPlugin(RenderPlugin);
  eleventyConfig.addBundle("css");
  eleventyConfig.addBundle("js");

  // Filters, data
  const mdLib = markdownIt({ html: true, linkify: true });
  eleventyConfig.addGlobalData("md", () => (content) => mdLib.render(content));
  eleventyConfig.addGlobalData("formatTime", () => (data, fmt) => moment.utc(data).format(fmt));
  eleventyConfig.addGlobalData("utils", () => utils);

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

  // Vendor JS Shortcode
  eleventyConfig.addShortcode("addVendorJs", function(packageName) {
    const filePath = require.resolve(packageName);
    const content = fs.readFileSync(filePath, "utf8");
    this.page.addHelperToBundle("js", content);
    return "";
  });

  // Asset Passthrough
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy({
    "node_modules/bootstrap/dist/js/bootstrap.bundle.min.js": "js/bootstrap.bundle.min.js",
    "node_modules/tocbot/dist/tocbot.min.js": "js/tocbot.min.js",
    "node_modules/tocbot/dist/tocbot.css": "css/tocbot.css",
    "node_modules/tocbot/dist/styles.css": "css/tocbotstyles.css",
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
