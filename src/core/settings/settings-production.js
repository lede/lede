exports.dbConnectionParams = {
  user: 'production',
  password: 'U*6}-%YpK06@;Rt',
  database: 'production',
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
      type: "file",
      absolute: true,
      filename: "/var/log/indexer.log",
      maxLogSize: 20480,
      backups: 10,
      pollInterval: 15,
      category: "indexer" 
    },
    {
      category: "scheduler",
      type: "console"
    },
    {
      type: "file",
      absolute: true,
      filename: "/var/log/scheduler.log",
      maxLogSize: 20480,
      backups: 10,
      pollInterval: 15,
      category: "scheduler" 
    },
    {
      category: "discoverer",
      type: "console"
    },
    {
      type: "file",
      absolute: true,
      filename: "/var/log/discoverer.log",
      maxLogSize: 20480,
      backups: 10,
      pollInterval: 15,
      category: "discoverer" 
    },
  ],
  levels: {
    indexer: "INFO",
    scheduler: "INFO",
    discoverer: "INFO"
  }
};

exports.scheduler = {
  checkInterval: 10, // seconds between checking the DB for feeds that need indexing
  minimumIndexInterval: 1800, // seconds since last indexing that must elapse before the feed will be considered for indexing again
};

exports.indexer = {
  workers: {
    "fast_index,slow_index": 1
  },
  throttleInterval: 60 // if a feed has been updated within this many seconds, it will not be updated again
};

exports.discoverer = {
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
