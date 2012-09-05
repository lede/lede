exports.dbConnectionParams = {
  user: 'ryan',
  password: 'ryandbpass',
  database: 'dev_ryan',
  host: 'unburythelede.com',
  port: 5432
};

exports.redisConnectionParams = {
  host: 'localhost',
  port: 6379
};

exports.log4jsConfig = {
  appenders: [
    {
      category: "indexer",
      type: "console"
    },
    {
      category: "scheduler",
      type: "console"
    },
    {
      category: "discoverer",
      type: "console"
    }
 ],
  levels: {
    indexer: "INFO",
    scheduler: "INFO",
    discoverer: "INFO",
    web: "INFO"
  }
};

exports.scheduler = {
  checkInterval: 60, // seconds between checking the DB for feeds that need indexing
  minimumIndexInterval: 1800, // seconds since last indexing that must elapse before the feed will be considered for indexing again
};

exports.indexer = {
  maxFetchSize: 300000, // bytes
  workers: {
    "fast_index,slow_index": 1
  },
  throttleInterval: 60, // if a feed has been updated within this many seconds, it will not be updated again
  maxIndexInterval: 1440, // max minutes between indexings
  minIndexInterval: 15 // min minutes between indexings
};

exports.discoverer = {
  maxFetchSize: 200000, // bytes
  workers: {
    "fast_discovery,slow_discovery": 1
  },
};

// common settings for the mailer used in notifier
exports.notifier = {
  host: 'smtp.sendgrid.net',
  port: '587',
  domain: 'unburythelede.com',
  authentication: 'login',
  username: 'lede',
  password: 'Passw0rd!'
};

exports.defaultSourceIndexInterval = 60; // minutes
