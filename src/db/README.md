## Library and general documentation
    [db-migrate](https://github.com/nearinfinity/node-db-migrate)

##  How to use it

### Create a new migration

    cd lede/src/db
    ./node_modules/db-migrate/bin/db-migrate create migration_name 


### Migrate up

    cd lede/src/db
    ./node_modules/db-migrate/bin/db-migrate up --config database.json -e dev_username

### Migrate down

    cd lede/src/db
    ./node_modules/db-migrate/bin/db-migrate down --config database.json -e dev_username
    