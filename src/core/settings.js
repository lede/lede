// this module is a magic thing to resolve the correct settings path based on
// the command line arguments, and perhaps at some point in the future, an
// environment variable or the user name or somesuch

if (process.argv.length < 3 || process.argv[2] == "") {
  console.log("Settings file must be first parameter");
  process.exit(1);
}

var path = require('path')

exports.get = function(module) {
  var settings = require(path.resolve(process.argv[2]));
  
  // alias the currently-running module's settings as currentModule so common code can use it indiscriminately
  settings.currentModule = settings[module];

  return settings;
}
