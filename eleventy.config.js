import { RenderPlugin } from "@11ty/eleventy";
import markdownIt from "markdown-it";
import * as sass from "sass";
import path from "node:path";
import fs from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

export default async function(eleventyConfig) {
  // 1. Plugins
  eleventyConfig.addPlugin(RenderPlugin);
  eleventyConfig.addBundle("css");
  eleventyConfig.addBundle("js");

  // 2. Markdown Filter
  const mdLib = markdownIt({ html: true, linkify: true });
  eleventyConfig.addFilter("md", (content) => mdLib.render(content));

  // 3. Sass Processing
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

  // 4. Vendor JS Shortcode (The "Cleaner" Way)
  eleventyConfig.addShortcode("addVendorJs", function(packageName) {
    const filePath = require.resolve(packageName);
    const content = fs.readFileSync(filePath, "utf8");
    this.page.addHelperToBundle("js", content);
    return "";
  });

  // 5. Asset Passthrough (for local images/fonts)
  eleventyConfig.addPassthroughCopy("src/assets");

  return {
    dir: {
      input: "src",
      output: "_site",
      data: "_data",
      includes: "_includes"
    }
  };
};
