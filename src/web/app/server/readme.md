
## Server.js

A lightweight tool for controlling daemonized clusters of express servers

## Setup

    npm install
    touch .pid

## Usage

### Starting clusters

To start a cluster (default size is 3 workers):

    node server.js start 

To start a cluster with 10 workers:

    node server.js start 10

You can specify a pidfile as well:

    touch /var/run/my-cluster.pid
    node server.js start 10 !$

### Rolling restarts

To perform a rolling restart of a cluster:

    node server.js restart

### Stopping a cluster

    node server.js stop
