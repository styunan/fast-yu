const { mkdir, confirm, write, loadTemplate } = require("./utils");
const path = require("path");
/**
 * Create application at the given directory.
 *
 * @param {string} name
 * @param {string} dir
 * @param {string} view
 */
function createExpressProject(name, dir, view) {
  
  confirm("创建简单的 express 项目? [\x1b[36my\x1b[0m/N]", function (ok) {
    if (ok) {
      createSimpleExpressProject(name, dir, view);
    } else {
      createComplexExpressProject(name, dir, view);
    }
  });
}
module.exports = createExpressProject;


/**
 * Create application at the given directory.
 *
 * @param {string} name
 * @param {string} dir
 * @param {string} view
 */
function createSimpleExpressProject(name, dir, view) {
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
  var app = loadTemplate("js/app-express.js");
  // App modules
  app.locals.kind = 'simple';

  // Template support
  switch (view) {
    case "express":
      app.locals.view = { engine: "express" };
      pkg.dependencies.express = "^4.17.1";
      break;
    case "node":
      app.locals.view = { engine: "node" };
      break;
    case "es6":
      app.locals.view = { engine: "es6" };
      break;
    default:
      app.locals.view = { engine: "world" };
      break;
  }

  if (dir !== ".") {
    mkdir(dir, ".");
  }

  mkdir(dir, ".vscode")

  // write files
  createLaunchJson(dir)
  write(path.join(dir, "index.js"), app.render());
  write(path.join(dir, "package.json"), JSON.stringify(pkg, null, 2) + "\n");
}


/**
 * Create application at the given directory.
 *
 * @param {string} name
 * @param {string} dir
 * @param {string} view
 */
function createComplexExpressProject(name, dir, view) {
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
  var app = loadTemplate("js/app-express.js");
  var html = loadTemplate("html/index-express.html");
  // App modules
  app.locals.kind = 'complex';

  // Template support
  switch (view) {
    case "express":
      app.locals.view = { engine: "express" };
      pkg.dependencies.express = "^4.17.1";
      break;
    case "node":
      app.locals.view = { engine: "node" };
      break;
    case "es6":
      app.locals.view = { engine: "es6" };
      break;
    default:
      app.locals.view = { engine: "world" };
      break;
  }

  if (dir !== ".") {
    mkdir(dir, ".");
  }

  mkdir(dir, "public")

  // write files
  createLaunchJson(dir)
  write(path.join(dir, "index.js"), app.render());
  write(path.join(dir, "public/index.html"), html.render());
  write(path.join(dir, "package.json"), JSON.stringify(pkg, null, 2) + "\n");
}

function createLaunchJson(dir) {
  // launch.json
  var launch = {
    version: "0.2.0",
    configurations: [
      {
        type: "pwa-node",
        request: "launch",
        name: "Launch Program",
        skipFiles: ["<node_internals>/**"],
        program: "${workspaceFolder}\\index.js"
      }
    ]
  };
  write(path.join(dir, ".vscode/launch.json"), JSON.stringify(launch, null, 2) + "\n");
}