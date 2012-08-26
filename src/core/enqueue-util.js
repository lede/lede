var _ = require('underscore');
var util = require('util');
var settings = require('./settings');

var queues = require('./resque-queues');

switch (process.argv[3]) {
  case 'fi':
    queue.fastIndex.enqueue({ source: process.argv[4] });
    console.log("enqueued fast_index");
    break;

  case 'si':
    queue.slowIndex.enqueue({ source: process.argv[4] });
    console.log("enqueued slow_index");
    break;

  case 'fd':
    queue.fastDiscover.enqueue({ url: process.argv[4] });
    console.log("enqueued fast_discovery");
    break;

  case 'sd':
    queue.slowDiscover.enqueue({ url: process.argv[4] });
    console.log("enqueued slow_discovery");
    break;

  case 'clean':
    console.log("Cleaning stale workers");
    queues.resque.cleanStaleWorkers();
    break;

  default:
    console.log("Unknown command");
    break;
}

setTimeout(process.exit, 100);
