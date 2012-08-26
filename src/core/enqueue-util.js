var _ = require('underscore');
var util = require('util');
var settings = require('./' + process.argv[2]); // TODO hack!

var resque = require('resque').connect(settings.redisConnectionParams);

switch (process.argv[3]) {
  case 'fti':
    resque.enqueue('fasttrack_index', 'Resque::Fasttrack_index', { feed: process.argv[4] });
    console.log("enqueued fasttrack_index");
    break;

  case 'si':
    resque.enqueue('scheduled_index', 'Resque::Scheduled_index', { feed: process.argv[4] });
    console.log("enqueued scheduled_index");
    break;

  case 'fd':
    resque.enqueue('fast_discovery', 'Resque::Fast_discovery', { url: process.argv[4] });
    console.log("enqueued fast_discovery");
    break;

  case 'fds': // fast discovery with subscribe
    resque.enqueue('fast_discovery', 'Resque::Fast_discovery', {
      url: process.argv[4],
      subscribe: {
        userId: process.argv[5] ? process.argv[5] : 1,
        folderId: process.argv[6]
      }
    });
    console.log("enqueued fast_discovery with subscribe");
    break;

  case 'sd':
    resque.enqueue('slow_discovery', 'Resque::Slow_discovery', { url: process.argv[4] });
    console.log("enqueued slow_discovery");
    break;
}

setTimeout(process.exit, 100);
