var settings = require('./' + process.argv[2]); // TODO hack!

var redis = require('redis').createClient(settings.redisConnectionParams.port, settings.redisConnectionParams.host);
redis.on('error', function(e) {
  log.fatal(e.message);
  process.exit(1);
});

var resque = require('resque').connect({redis: redis});

function queue(queueName, functionName) {
  this.queueName = queueName;
  this.functionName = functionName;
  this.enqueue = function (obj) { return resque.enqueue(this.queueName, this.functionName, obj) };
}

exports.fastIndex = new queue('fasttrack_index', 'Resque::Fasttrack_index');
exports.slowIndex = new queue('scheduled_index', 'Resque::Scheduled_index');
exports.fastDiscover = new queue('fast_discovery', 'Resque::Fast_discovery');
exports.slowDiscover = new queue('slow_discovery', 'Resque::Slow_discovery');
