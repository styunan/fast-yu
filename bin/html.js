const { mkdir, write, loadTemplate } = require("./utils");
const path = require("path");
/**
 * Create application at the given directory.
 *
 * @param {string} dir
 */
function createHtmlProject(dir) {
  // JavaScript
  var app = loadTemplate("js/app-html.js");
  var html = loadTemplate("html/index-html.html");

  if (dir !== ".") {
    mkdir(dir, ".");
  }

  // write files
  write(path.join(dir, "index.js"), app.render());
  write(path.join(dir, "index.html"), html.render());
}
module.exports = createHtmlProject;