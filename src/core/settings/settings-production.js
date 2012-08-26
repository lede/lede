exports.dbConnectionParams = {
  user: 'ledeapp',
  password: 'dbpass',
  database: 'lede_production',
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
    }
  ],
  levels: {
    indexer: "INFO",
    scheduler: "INFO"
  }
};

exports.scheduler = {
  checkInterval: 60, // seconds between checking the DB for feeds that need indexing
  minimumIndexInterval: 1800, // seconds since last indexing that must elapse before the feed will be considered for indexing again
};

exports.indexer = {
  workers: {
    "fasttrack_index,scheduled_index": 1
  },
  throttleInterval: 60 // if a feed has been updated within this many seconds, it will not be updated again
};
