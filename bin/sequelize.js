const { mkdir, write, loadTemplate } = require("./utils");
const path = require("path");

/**
 * Create application at the given directory.
 *
 * @param {string} name
 * @param {string} dir
 */
function createSequelizeProject(name, dir) {
  // Package.json
  var pkg = {
    name: name,
    version: "1.0.0",
    description: "",
    private: true,
    scripts: {
      start: "node index.js",
    },
    keywords: [],
    author: "",
    license: "ISC",
    dependencies: {},
  };
  // JavaScript
  var app = loadTemplate("js/app-sequelize.js");
  var db = loadTemplate("js/db-sequelize.js");
  var query = loadTemplate("js/query-sequelize.js");
  app.locals.view = { engine: "sequelize" };
  pkg.dependencies.express = "^4.17.1";
  pkg.dependencies.sequelize = "^6.3.5";
  pkg.dependencies.pg = "^8.5.1";
  pkg.dependencies['pg-hstore'] = "^2.3.3";

  if (dir !== ".") {
    mkdir(dir, ".");
  }

  // mkdir(dir, "public")

  // write files
  write(path.join(dir, "index.js"), app.render());
  write(path.join(dir, "sequelize.js"), db.render());
  write(path.join(dir, "query.js"), query.render());
  write(path.join(dir, "package.json"), JSON.stringify(pkg, null, 2) + "\n");
}

module.exports = createSequelizeProject;