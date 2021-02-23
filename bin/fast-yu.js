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
    "-s, --sequelize",
    "add sequelize project",
    renamedOption("--sequelize", "--view=sequelize")
  )
  .option(
    "    --es6",
    "add ECMAScript 6 project",
    renamedOption("--es6", "--view=es6")
  )
  .option(
    "-v, --view <engine>",
    "add View <engine> support (express|node|es6|sequelize) (defaults to express)"
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
    case "node":
      break;
    case "es6":
      break;
    case "sequelize":
      createSequelizeProject(name, dir);
      break;
    default:
      break;
  }
}
