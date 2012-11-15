var redis = require('redis').createClient(settings.redisConnectionParams.port, settings.redisConnectionParams.host);
redis.on('error', function(e) {
  log.fatal(e.message);
  process.exit(1);
});

var resque = require('resque').connect({redis: redis});

function queue(queueName, functionName) {
  this.queueName = queueName;
  this.functionName = functionName;
  this.enqueue = function (obj) { return resque.enqueue(this.queueName, this.functionName, obj) }; // TODO this should really take a callback, but our resque library doesn't offer one (the underlying redis library does, however)
}

exports.resque = resque;
exports.redis = redis;
exports.fastIndex = new queue('fast_index', 'Resque::Fast_index');
exports.slowIndex = new queue('slow_index', 'Resque::Slow_index');
exports.fastDiscover = new queue('fast_discovery', 'Resque::Fast_discovery');
exports.slowDiscover = new queue('slow_discovery', 'Resque::Slow_discovery');
