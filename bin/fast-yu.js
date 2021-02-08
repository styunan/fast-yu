#!/usr/bin/env node

const {
  exit,
  renamedOption,
  mkdir,
  write,
  loadTemplate,
  confirm,
  emptyDirectory,
  createAppName,
  around,
  before,
} = require("./utils");
const path = require("path");
const program = require("commander");

const VERSION = require("../package").version;

process.exit = exit;

// CLI
around(program, "optionMissingArgument", function (fn, args) {
  program.outputHelp();
  fn.apply(this, args);
  return { args: [], unknown: [] };
});

before(program, "outputHelp", function () {
  // track if help was shown for unknown option
  this._helpShown = true;
});

before(program, "unknownOption", function () {
  // allow unknown options if help was shown, to prevent trailing error
  this._allowUnknownOption = this._helpShown;

  // show help if not yet shown
  if (!this._helpShown) {
    program.outputHelp();
  }
});

program
  .name("fast")
  .version(VERSION, "    --version")
  .usage("[options] [dir]")
  .option(
    "-e, --express",
    "add express project",
    renamedOption("--express", "--view=express")
  )
  .option(
    "-n, --node",
    "add nodejs project",
    renamedOption("--node", "--view=node")
  )
  .option(
    "    --es6",
    "add ECMAScript 6 project",
    renamedOption("--es6", "--view=es6")
  )
  .option(
    "-v, --view <engine>",
    "add View <engine> support (express|node|es6) (defaults to express)"
  )
  .option("-f, --force", "force on non-empty directory")
  .parse(process.argv);

if (!exit.exited) {
  main();
}

/**
 * Main program.
 */
function main() {
  // Path
  var destinationPath = program.args.shift() || ".";
  // App name
  var appName = createAppName(path.resolve(destinationPath)) || "hello-world";

  // Default view engine
  const options = program.opts();
  if (options.express) options.view = "express";
  if (options.node) options.view = "node";
  if (options.es6) options.view = "es6";

  // Generate application
  emptyDirectory(destinationPath, function (empty) {
    if (empty || options.force) {
      createApplication(appName, destinationPath);
    } else {
      confirm("destination is not empty, continue? [y/N] ", function (ok) {
        if (ok) {
          process.stdin.destroy();
          createApplication(appName, destinationPath);
        } else {
          console.error("aborting");
          exit(1);
        }
      });
    }
  });
}

/**
 * Create application at the given directory.
 *
 * @param {string} name
 * @param {string} dir
 */

function createApplication(name, dir) {
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
  var app = loadTemplate("js/app.js");
  // App modules
  app.locals.mounts = [];

  const options = program.opts();
  // Template support
  switch (options.view) {
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

  // mkdir(dir, "public")

  // write files
  write(path.join(dir, "index.js"), app.render());
  write(path.join(dir, "package.json"), JSON.stringify(pkg, null, 2) + "\n");
}
