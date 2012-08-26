# replace these with your server's information
set :domain,  "unburythelede.com"
set :user,    "deploy"

# name this the same thing as the directory on your server
set :application, "lede-app"

# use a hosted repository
set :repository, "ssh://git@github.com/lede/lede.git"

server "#{domain}", :app, :web, :db, :primary => true

set :deploy_via, :copy
set :copy_exclude, [".git", ".DS_Store"]
set :scm, :git
set :branch, "master"
# set this path to be correct on yoru server
set :deploy_to, "/home/#{user}/#{application}"
set :use_sudo, false
set :keep_releases, 2
set :git_shallow_clone, 1

ssh_options[:paranoid] = false

set :app_path, "src/web/app"
set :migration_path, "src/db"

set :cluster_size, 3

# this tells capistrano what to do when you deploy
namespace :deploy do

  desc <<-DESC
  A macro-task that updates the code and fixes the symlink.
  DESC
  task :default do
    # FIXME - just kill this off or alias to launch - what it's doing now gets out of sync w/ db
    transaction do
      update_code
      symlink
    end
  end

  task :update_code, :except => { :no_release => true } do
    on_rollback { run "rm -rf #{release_path}; true" }
    strategy.deploy!
  end

  task :after_deploy do
    cleanup
  end

  task :launch do
    update_code
    update_dependencies
    migrate
    symlink # FIXME: danger - at this point static assets are updated but dynamic code isn't reloaded
    rolling_restart
  end

  task :rolling_restart do
    run "cd #{current_path}/#{app_path} && node ./server/server.js restart #{cluster_size} /var/run/express-cluster.pid"
  end

  task :migrate do
    run "cd #{latest_release}/#{migration_path} && ./node_modules/db-migrate/bin/db-migrate up --config database.json -e production"
  end

  task :update_server_dependencies do
    run "cd #{latest_release}/#{app_path}/server && npm install"
  end

  task :update_app_dependencies do
    run "cd #{latest_release}/#{app_path} && npm install"
  end

  task :update_migrate_dependencies do
    run "cd #{latest_release}/#{migration_path} && npm install"
  end

  task :update_dependencies do
    update_migrate_dependencies
    update_server_dependencies
    update_app_dependencies
  end

end


