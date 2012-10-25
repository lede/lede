settings = require('./settings').get("enqueue-util");
var _ = require('underscore');
var util = require('util');

var queues = require('./resque-queues');

switch (process.argv[2]) {
  case 'fi':
    queues.fastIndex.enqueue({ source: process.argv[3] });
    console.log("enqueued fast_index");
    break;

  case 'si':
    queues.slowIndex.enqueue({ source: process.argv[3] });
    console.log("enqueued slow_index");
    break;

  case 'fd':
    queues.fastDiscover.enqueue({ url: process.argv[3] });
    console.log("enqueued fast_discovery");
    break;

  case 'sd':
    queues.slowDiscover.enqueue({ url: process.argv[3] });
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
