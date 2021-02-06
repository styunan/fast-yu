#!/usr/bin/env node

const fs = require("fs");
const ejs = require("ejs");
const util = require("util");
const mkdirp = require("mkdirp");
const readline = require("readline");
const path = require("path");
const program = require("commander");

const VERSION = require("../package").version;
const MODE_0666 = parseInt("0666", 8);
const MODE_0755 = parseInt("0755", 8);

var _exit = process.exit;
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
    "add ECMAScript 6 project",
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
  main()
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
  if (options.view === true) {
    if (options.express) options.view = "express";
    if (options.node) options.view = "node";
    if (options.es6) options.view = "es6";
  }

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

/**
 * Generate a callback function for commander to warn about renamed option.
 *
 * @param {String} originalName
 * @param {String} newName
 */

function renamedOption(originalName, newName) {
  return function (val) {
    warning(
      util.format("option `%s' has been renamed to `%s'", originalName, newName)
    );
    return val;
  };
}

/**
 * Create an app name from a directory path, fitting npm naming requirements.
 *
 * @param {String} pathName
 */

function createAppName(pathName) {
  return path
    .basename(pathName)
    .replace(/[^A-Za-z0-9.-]+/g, "-")
    .replace(/^[-_.]+|-+$/g, "")
    .toLowerCase();
}

/**
 * Check if the given directory `dir` is empty.
 *
 * @param {String} dir
 * @param {Function} fn
 */

function emptyDirectory(dir, fn) {
  fs.readdir(dir, function (err, files) {
    if (err && err.code !== "ENOENT") throw err;
    fn(!files || !files.length);
  });
}

/**
 * Load template file.
 */

function loadTemplate(name) {
  var contents = fs.readFileSync(
    path.join(__dirname, "..", "templates", name + ".ejs"),
    "utf-8"
  );
  var locals = Object.create(null);

  function render() {
    return ejs.render(contents, locals, {
      escape: util.inspect,
    });
  }

  return {
    locals: locals,
    render: render,
  };
}

/**
 * Make the given dir relative to base.
 *
 * @param {string} base
 * @param {string} dir
 */

function mkdir(base, dir) {
  var loc = path.join(base, dir);

  console.log("   \x1b[36mcreate\x1b[0m : " + loc + path.sep);
  mkdirp.sync(loc, MODE_0755);
}

/**
 * echo str > file.
 *
 * @param {String} file
 * @param {String} str
 */

function write(file, str, mode) {
  fs.writeFileSync(file, str, { mode: mode || MODE_0666 });
  console.log("   \x1b[36mcreate\x1b[0m : " + file);
}

/**
 * Prompt for confirmation on STDOUT/STDIN
 */

function confirm(msg, callback) {
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question(msg, function (input) {
    rl.close();
    callback(/^y|yes|ok|true$/i.test(input));
  });
}

/**
 * Graceful exit for async STDIO
 */

function exit(code) {
  // flush output for Node.js Windows pipe bug
  function done() {
    if (!draining--) _exit(code);
  }

  var draining = 0;
  var streams = [process.stdout, process.stderr];

  exit.exited = true;

  streams.forEach(function (stream) {
    // submit empty write request and wait for completion
    draining += 1;
    stream.write("", done);
  });

  done();
}

/**
 * Display a warning similar to how errors are displayed by commander.
 *
 * @param {String} message
 */

function warning(message) {
  console.error();
  message.split("\n").forEach(function (line) {
    console.error("  warning: %s", line);
  });
  console.error();
}

/**
 * Install an around function; AOP.
 */

function around(obj, method, fn) {
  var old = obj[method];

  obj[method] = function () {
    var args = new Array(arguments.length);
    for (var i = 0; i < args.length; i++) args[i] = arguments[i];
    return fn.call(this, old, args);
  };
}

/**
 * Install a before function; AOP.
 */

function before(obj, method, fn) {
  var old = obj[method];

  obj[method] = function () {
    fn.call(this);
    old.apply(this, arguments);
  };
}
