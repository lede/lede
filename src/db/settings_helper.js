if (process.argv.length < 3 || process.argv[2] === "") {
  console.log("Settings file must be first parameter");
  process.exit(1);
}

var fs = require('fs');
var path = require('path');
var settings_file = path.basename(process.argv[2], '.js');
var prefix = (settings_file.split('-'))[0];
var username = (settings_file.split('-'))[1];

if (prefix != 'settings' || username === '') {
  console.log("Settings filename must be of the form 'settings-<username>.js'");
  process.exit(1);
}

var settings = require('../core/settings');

var dbconf = {};
dbconf[settings.dbConnectionParams.user] = {
  "driver": "pg",
  "user": settings.dbConnectionParams.user,
  "password": settings.dbConnectionParams.password,
  "host": settings.dbConnectionParams.host,
  "database": settings.dbConnectionParams.database
};

var buffer = JSON.stringify(dbconf);
fs.writeFileSync('TESTdatabase.json', buffer);

console.log(dbconf);
