/* imports */
var daemon = require('daemon');
var _ = require('underscore');
var fs = require('fs');
var spawn = require('child_process').spawn;
var util = require('util');

/* constants */

// default worker count if none is specified on the command line
var DEFAULT_WORKER_NUM = 3;
var DEFAULT_BASE_PORT = 3000;
var DEFAULT_PIDFILE = '.pid'; // should really be specified, this will be placed in working copy

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
var command = coalesce(process.argv[2], COMMANDS.start);
// TODO: use a real argument parsing library
var target = process.argv[3];
if(command != COMMANDS.help && _.isUndefined(target)) {
  console.log('Target to run must be provided');
  process.exit(1);
}
var worker_num = coalesce(process.argv[4], DEFAULT_WORKER_NUM);
var pidfile = coalesce(process.argv[5], DEFAULT_PIDFILE);
var base_port = parseInt(coalesce(process.argv[6], DEFAULT_BASE_PORT));


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
  console.log('Usage: node server.js [start|stop|restart|help] target [workers] [pidfile] [base-port]');
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

function start_child(port) {
    var parent_env = process.env;
    parent_env['PORT'] = port;
    child = spawn('node', [target], { env: parent_env }); 
    child.on('exit', function(code) {
      console.log(child.pid + ' exited with code: ' + code);
    });
    child.stdout.on('data', function(data) {
      console.log(child.pid + ' [OUT] '  + data);
    });
    child.stderr.on('data', function(data) {
      console.log(child.pid + ' [ERR] '  + data);
    });
    return child;
}

function server_daemon() {

  // write out the pidfile
  fs.writeFile(pidfile, process.pid, function(err) {
    if(err) {
      console.log(err);
      process.exit(1);
    }
  });

  // list of children
  children = [];

  for(var worker_index = 0; worker_index < worker_num; worker_index++) {
    console.log('Starting worker on port: ' + base_port + worker_index);
    children.push(start_child(base_port + worker_index));
  }

  // handle restart signal
  process.on('SIGHUP', function() {

    // list of new children
    var new_children = [];
    var port_offset = 0;

    // rolling restart, kill off old children and start new ones
    _.each(children, function(child) {
      child.kill();
      new_children.push(start_child(port));
    });

    // swap child over list over to new one
    children = new_children;
  });

  // handle stop cleanly
  process.on('SIGINT', function() {
    _.each(children, function(child) {
      child.kill();
    });
    process.exit(0);
  });

  // handle hard stop
  process.on('SIGKILL', function() {
    _.each(children, function(child) {
      child.kill('SIGKILL');
    });
    process.exit(0);
  });

  console.log('Registered signal handlers');
}
