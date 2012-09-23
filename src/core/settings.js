// this module is a magic thing to resolve the correct settings path based on
// the command line arguments, and perhaps at some point in the future, an
// environment variable or the user name or somesuch

var path = require('path');
var confuse = require('confuse');

var user = process.env['USER'];
var ledeHome = process.env['LEDE_HOME']; // home directory of the Lede installation
var ledeConfig = process.env['LEDE_CONFIG']; // allow overriding of the default config file

if (!ledeHome) {
  ledeHome = '..'; // assume we're invoking from the directory of a component
}

var userFile = ledeConfig ? ledeConfig : (user + '.json');

var confuseOpts = {
  files: [
    userFile,
    'config.json'
  ],
  dir: path.resolve(ledeHome, 'user-config')
};

var settings = confuse(confuseOpts);

exports.get = function(module) {
  // alias the currently-running module's settings as currentModule so common code can use it indiscriminately
  settings.currentModule = settings[module];

  return settings;
}
