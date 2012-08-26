
## Requirements

### Migrations

db-migrate needs to be properly set up. See the readme in src/db/ for full details, but basically:

$ cd <repo-root>/src/db/migrate && npm install

And you should be set.

### Server access

You will need to have have keys for the deploy account on the production server to launch.

To set this up,

$ ssh <you>@unburythelede.com
$ sudo su deploy
$ cd
$ cat <your public ssh key> >> .ssh/authorized_keys

## Launching to production

$ cap deploy:launch

Will launch the latest (according to origin) code to production, migrating the db first.

## Updating the database on production without launching

You probably never want to do this (and it is a bit dangerous), but:

$ cap deploy:migrate

Will run the latest (according to origin) migrations on production.

