// this module is a magic thing to resolve the correct settings path based on
// the command line arguments, and perhaps at some point in the future, an
// environment variable or the user name or somesuch

if (process.argv.length < 3 || process.argv[2] == "") {
  console.log("Settings file must be first parameter");
  process.exit(1);
}

var path = require('path')
module.exports = require(path.resolve(process.argv[2]))
