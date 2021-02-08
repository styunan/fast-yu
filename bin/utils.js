const fs = require("fs");
const ejs = require("ejs");
const util = require("util");
const path = require("path");
const mkdirp = require("mkdirp");
const readline = require("readline");
const MODE_0666 = parseInt("0666", 8);
const MODE_0755 = parseInt("0755", 8);

var _exit = process.exit;

/**
 * Display a warning similar to how errors are displayed by commander.
 *
 * @param {string} message
 */
function warning(message) {
  console.error();
  message.split("\n").forEach(function (line) {
    console.error("  warning: %s", line);
  });
  console.error();
}
exports.warning = warning;

/**
 * Install an around function; AOP.
 *
 * @param obj
 * @param method
 * @param fn
 */
function around(obj, method, fn) {
  var old = obj[method];

  obj[method] = function () {
    var args = new Array(arguments.length);
    for (var i = 0; i < args.length; i++) args[i] = arguments[i];
    return fn.call(this, old, args);
  };
}
exports.around = around;

/**
 * Install a before function; AOP.
 *
 * @param obj
 * @param method
 * @param fn
 */
function before(obj, method, fn) {
  var old = obj[method];

  obj[method] = function () {
    fn.call(this);
    old.apply(this, arguments);
  };
}
exports.before = before;

/**
 * Generate a callback function for commander to warn about renamed option.
 *
 * @param {string} originalName
 * @param {string} newName
 */
function renamedOption(originalName, newName) {
  return function (val) {
    warning(
      util.format("option `%s' has been renamed to `%s'", originalName, newName)
    );
    return val;
  };
}
exports.renamedOption = renamedOption;

/**
 * Create an app name from a directory path, fitting npm naming requirements.
 *
 * @param {string} pathName
 */
function createAppName(pathName) {
  return path
    .basename(pathName)
    .replace(/[^A-Za-z0-9.-]+/g, "-")
    .replace(/^[-_.]+|-+$/g, "")
    .toLowerCase();
}
exports.createAppName = createAppName;

/**
 * Check if the given directory `dir` is empty.
 *
 * @param {string} dir
 * @param {Function} fn
 */
function emptyDirectory(dir, fn) {
  fs.readdir(dir, function (err, files) {
    if (err && err.code !== "ENOENT") throw err;
    fn(!files || !files.length);
  });
}
exports.emptyDirectory = emptyDirectory;

/**
 * Load template file.
 *
 * @param name
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
exports.loadTemplate = loadTemplate;

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
exports.mkdir = mkdir;

/**
 * echo str > file.
 *
 * @param {string} file
 * @param {string} str
 * @param mode
 */
function write(file, str, mode) {
  fs.writeFileSync(file, str, { mode: mode || MODE_0666 });
  console.log("   \x1b[36mcreate\x1b[0m : " + file);
}
exports.write = write;

/**
 * Prompt for confirmation on STDOUT/STDIN
 *
 * @param msg
 * @param callback
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
exports.confirm = confirm;

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
exports.exit = exit;
