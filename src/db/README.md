
##  How to use migrations

### Create a new migration

    cd lede/src/db
    ./node_moduls/migrate/bin/migrate create <migration_name>

This will create:

    migrations/<NNN>-<migration_name>.js

Containing up() and down() exports.


### Migrate up

    cd lede/src/db
    LEDE_DB=dev_yourname ./node_modules/migrate/bin/migrate

### Migrate down

    cd lede/src/db
    LEDE_DB=dev_yourname ./node_modules/migrate/bin/migrate down
    

## Basic Organization and Functional Description

### Libraries

We use [node-migrate](https://github.com/visionmedia/node-migrate) in order to provide basic up/down versioned migration support.

Unlike Rake + ActiveRecord our migration system is abstract and agnostic and doesn't provide an ORM or data access layer so we go more or less straight to the metal with [pg](https://github.com/brianc/node-postgres).

### Configuration and Connections

Database connection information for all environments is stored in db/database.json, like so:

    {
      ...
      "foo_environment": {
        "user": "foo",
        "password": "bar123",
        "host": "unburythelede.com",
        "database": "foo_db"
      }
      ...
    }

The only configuration values currently supported are:
* user
* password
* host
* database

All configuration information is url encoded and concatenated into a connection string, so URI control characters like the '%' symbol can be used without escaping.

In order to avoid duplicating work across migration re-implementing code to load configuration and connect to the database, we use a simple wrapper, db/db.js to load the appropriate configuration from db/database.json, connect to the database, and expose a run() method that consumes SQL and a callback to be run after execution of the SQL is complete.

Migrations that leverage db/db.js should be invoked with LEDE\_DB passed as an environment variable set to the key in database.json corresponding to the environment that migrations should connect to and be run on.

### State Management, Migration History

Since node-migrate is extremely db agnostic, it doesn't keep a migrations table, but instead keeps track of the current migration state in a json file stored at migrations/.migrate. If you ever need to nuke your database, this is file should be removed or emptied prior to running the migrations back up. This dot-file based solution isn't sufficient for synching database state across multiple machines, and will need to be improved in the future using an alternative data store.

