/* imports */
var daemon = require('daemon');
var _ = require('underscore');
var fs = require('fs');
var cluster_master = require('cluster-master');

/* constants */

// default worker count if none is specified on the command line
var DEFAULT_WORKER_NUM = 3;
var DEFAULT_PIDFILE = '.pid'; // should really be specified, this will be placed in working copy
var DEFAULT_LOGFILE = '.log'; // ditto

// supported commands enum
var COMMANDS = {
  start: 'start',
  stop: 'stop',
  restart: 'restart',
  help: 'help'
};

/* utility function for coalescing undefined */
// TODO: this should be broken out into a shared library if it proves useful
function coalesce(val, fallback) {
  return _.isUndefined(val) ? fallback : val;
}

/* argument parsing */
// TODO: use a real argument parsing library
var command = coalesce(process.argv[2], COMMANDS.start);
var worker_num = coalesce(process.argv[3], DEFAULT_WORKER_NUM);
var pidfile = coalesce(process.argv[4], DEFAULT_PIDFILE);
var logfile = coalesce(process.argv[5], DEFAULT_LOGFILE);


/* command implementations */

function start(workers) {
  console.log('Starting server with ' + workers + ' worker(s)');
  daemon.start(); // daemonize code after this (deep magic)
  server_daemon(); // kick off server cluster
}

function stop() {
  console.log('Stopping server cluster');
  get_daemon(function(pid) {
    process.kill(pid, 'SIGINT'); // don't kill, just signal a restart with SIGHUP
  });
}

function restart(workers) {
  console.log('Restarting server cluster');
  get_daemon(function(pid) {
    process.kill(pid, 'SIGHUP'); // don't kill, just signal a restart with SIGHUP
  });
}

function help() {
  console.log('Usage: node server.js start|stop|restart|help [workers] [pidfile] [logfile]');
}

// helper to get the daemon process for signaling
function get_daemon(cb) {
  fs.readFile(pidfile, function(err, pid) {
    if(err) {
      console.log(err);
      process.exit(1);
    }
    cb(pid);
  });
}


/* command dispatch */
switch(command) {
  case COMMANDS.start:
    start(worker_num);
    break;
  case COMMANDS.restart:
    restart(worker_num);
    break;
  case COMMANDS.stop:
    stop();
    break;
  case COMMANDS.help:
    help();
    break;
}

/* Daemon implementation */

function server_daemon() {

  // write out the pidfile
  fs.writeFile(pidfile, process.pid, function(err) {
    if(err) {
      console.log(err);
      process.exit(1);
    }
  });

  // kick off the actual server cluster
  cluster_master({
    exec: 'app.js',
    size: worker_num
  });

  // handle restart signal
  process.on('SIGHUP', function() {
    cluster_master.restart();
  });

  // handle stop cleanly
  process.on('SIGINT', function() {
    cluster_master.quit();
    process.exit(0);
  });

  // handle hard stop
  process.on('SIGKILL', function() {
    cluster_master.quitHard();
    process.exit(0);
  });
}
