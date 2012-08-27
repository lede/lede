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

set :web_app_path, "src/web/app"
set :core_path, "src/core"
set :discoverer_path, "src/discoverer"
set :indexer_path, "src/indexer"
set :notifier_path, "src/notifier"
set :scheduler_path, "src/scheduler"
set :migration_path, "src/db"
set :server_path, "#{releases_path}/../server-control"

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

  task :web_launch do
    update_code
    update_dependencies
    migrate
    symlink # FIXME: danger - at this point static assets are updated but dynamic code isn't reloaded
    relink_core
    fast_restart
  end

  task :launch do
    web_launch
    update_discoverer_dependencies
    update_indexer_dependencies
    update_notifier_dependencies
    update_scheduler_dependencies
    discoverer_restart
    indexer_restart
    notifier_restart
    scheduler_restart
  end

  task :relink_core do
    run "cd #{latest_release}/#{core_path} && npm link FastLegS"
    run "cd #{latest_release}/#{core_path} && npm update"
  end

  task :migrate do
    run "cd #{latest_release}/#{migration_path} && ./node_modules/db-migrate/bin/db-migrate up --config database.json -e production"
  end

  task :update_server_dependencies do
    run "cd #{latest_release}/#{web_app_path}/server && npm install"
  end

  task :update_app_dependencies do
    run "cd #{latest_release}/#{web_app_path} && npm install"
  end

  task :update_migrate_dependencies do
    run "cd #{latest_release}/#{migration_path} && npm install"
  end

  task :update_discoverer_dependencies do
    run "cd #{latest_release}/#{discoverer_path} && npm install"
  end

  task :update_indexer_dependencies do
    run "cd #{latest_release}/#{indexer_path} && npm install"
  end

  task :update_notifier_dependencies do
    run "cd #{latest_release}/#{notifier_path} && npm install"
  end

  task :update_scheduler_dependencies do
    run "cd #{latest_release}/#{scheduler_path} && npm install"
  end

  task :rolling_restart do
    run "cd #{current_path}/#{web_app_path} && node ./server/server.js restart #{cluster_size} /var/run/express-cluster.pid"
  end

  task :fast_restart do
    begin 
      run "cd #{server_path} && node server.js stop #{current_path}/#{web_app_path}/app.js #{current_path}/src/core/settings/settings-production.js #{cluster_size} /var/run/express-cluster.pid"
    rescue => e
      p "Looks like the server wasn't running, we'll just start it."
    end
    run "cd #{server_path} && node server.js start #{current_path}/#{web_app_path}/app.js #{current_path}/src/core/settings/settings-production.js #{cluster_size} /var/run/express-cluster.pid"
  end

  task :discoverer_restart do
    begin 
      run "cd #{server_path} && node server.js stop #{current_path}/#{discoverer_path}/discoverer.js #{current_path}/src/core/settings/settings-production.js 1 /var/run/discoverer-cluster.pid"
    rescue => e
      p "Looks like the server wasn't running, we'll just start it."
    end
    run "cd #{server_path} && node server.js start #{current_path}/#{discoverer_path}/discoverer.js #{current_path}/src/core/settings/settings-production.jsv 1 /var/run/discoverer-cluster.pid"
  end

  task :indexer_restart do
    begin 
      run "cd #{server_path} && node server.js stop #{current_path}/#{indexer_path}/indexer.js #{current_path}/src/core/settings/settings-production.js 1 /var/run/indexer-cluster.pid"
    rescue => e
      p "Looks like the server wasn't running, we'll just start it."
    end
    run "cd #{server_path} && node server.js start #{current_path}/#{indexer_path}/indexer.js #{current_path}/src/core/settings/settings-production.js 1 /var/run/indexer-cluster.pid"
  end

  task :notifier_restart do
    begin 
      run "cd #{server_path} && node server.js stop #{current_path}/#{notifier_path}/notifier.js #{current_path}/src/core/settings/settings-production.js 1 /var/run/notifier-cluster.pid"
    rescue => e
      p "Looks like the server wasn't running, we'll just start it."
    end
    run "cd #{server_path} && node server.js start #{current_path}/#{notifier_path}/notifier.js #{current_path}/src/core/settings/settings-production.js 1 /var/run/notifier-cluster.pid"
  end

  task :scheduler_restart do
    begin 
      run "cd #{server_path} && node server.js stop #{current_path}/#{scheduler_path}/scheduler.js #{current_path}/src/core/settings/settings-production.js 1 /var/run/scheduler-cluster.pid"
    rescue => e
      p "Looks like the server wasn't running, we'll just start it."
    end
    run "cd #{server_path} && node server.js start #{current_path}/#{scheduler_path}/scheduler.js #{current_path}/src/core/settings/settings-production.js 1 /var/run/scheduler-cluster.pid"
  end

  task :update_dependencies do
    update_migrate_dependencies
    update_server_dependencies
    update_app_dependencies
  end

end


