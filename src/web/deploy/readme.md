
## Requirements

### Server access

You will need to have have keys for the deploy account on the production server to launch.

To set this up,

$ ssh <you>@unburythelede.com
$ sudo su deploy
$ cd
$ cat <your public ssh key> >> .ssh/authorized_keys

## Launching to production

To run a zero-downtime launch,

$ cap deploy:launch

This will:

1. Copy the latest (according to github) code to production
2. Build / install any packages required for migrations, the web app, or server cluster control
3. Run migrations
4. Perform a rolling restart of the web app

## Updating the database on production without launching

You probably never want to do this (and it is a bit dangerous), but:

$ cap deploy:migrate

Will run the latest (according to github) migrations on production.


