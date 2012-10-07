## Library and general documentation
    [db-migrate](https://github.com/nearinfinity/node-db-migrate)

##  How to use it

### Create a new migration

    cd lede/src/db
    ./node_moduls/migrate/bin/migrate create <migration_name>


### Migrate up

    cd lede/src/db
    LEDE_DB=dev_yourname ./node_modules/migrate/bin/migrate

### Migrate down

    cd lede/src/db
    LEDE_DB=dev_yourname ./node_modules/migrate/bin/migrate down
    
