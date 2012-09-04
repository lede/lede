var log4js = require('log4js');

log4js.configure(settings.log4jsConfig, {});

//var logger = log4js.getLogger('indexer');

log4js.replaceConsole();

module.exports = log4js; // TODO figure out why this behaves differently than exports = log4js
