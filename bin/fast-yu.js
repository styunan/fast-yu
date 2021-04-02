#!/usr/bin/env node

const {
  exit,
  renamedOption,
  confirm,
  emptyDirectory,
  createAppName,
  around,
  before,
} = require("./utils");
const createExpressProject = require("./express");
const createHtmlProject = require("./html");
const createSequelizeProject = require("./sequelize");
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
  .name("fast-yu")
  .version(VERSION, "    --version")
  .usage("[options] <dir>")
  .option(
    "-e, --express <dir>",
    "add express project",
    renamedOption("--express", "--view=express")
  )
  .option(
    "-s, --sequelize<dir>",
    "add sequelize project",
    renamedOption("--sequelize", "--view=sequelize")
  )
  .option(
    "-h, --html <dir>",
    "add html5 project",
    renamedOption("--html", "--view=html")
  )
  .option(
    "-v, --view <engine>",
    "add View <engine> support (express|html|sequelize) (defaults to express)"
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
  if (options.html) options.view = "html";
  if (options.sequelize) options.view = "sequelize";

  if (!options.view) {
    program.outputHelp();
    return;
  }
  // Generate application
  emptyDirectory(destinationPath, function (empty) {
    if (empty || options.force) {
      createApplication(appName, destinationPath);
    } else {
      confirm("目录已经存在，是否继续? [\x1b[36my\x1b[0m/N] ", function (ok) {
        if (ok) {
          createApplication(appName, destinationPath);
        } else {
          console.error("取消");
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
  const options = program.opts();
  // Template support
  switch (options.view) {
    case "express":
      createExpressProject(name, dir, options.view);
      break;
    case "html":
      createHtmlProject(dir);
      break;
    case "sequelize":
      createSequelizeProject(name, dir);
      break;
    default:
      createExpressProject(name, dir, options.view);
      break;
  }
}
