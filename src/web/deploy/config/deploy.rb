# replace these with your server's information
set :domain,  "unburythelede.com"
set :user,    "deploy"

# name this the same thing as the directory on your server
set :application, "lede-app"

# use a hosted repository
set :repository, "ssh://git@github.com/lede/lede.git"

server "#{domain}", :web, :db, :primary => true
server "ec2-184-72-70-49.compute-1.amazonaws.com", :crawler

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
set :recommender_path, "src/recommender"
set :scheduler_path, "src/scheduler"
set :bookmarklet_source_path, "src/bookmarklet"
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

  task :update_code, :except => { :no_release => true }, :roles => [:db, :web, :crawler] do
    on_rollback { run "rm -rf #{release_path}; true" }
    strategy.deploy!
  end

  task :after_deploy, :roles => [:db, :web, :crawler] do
    cleanup
  end

  task :web_launch, :roles => [:web] do
    update_code
    update_dependencies
    migrate
    symlink # FIXME: danger - at this point static assets are updated but dynamic code isn't reloaded
    rebuild_bookmarklet
    relink_core
    fast_restart
  end

  task :launch, :roles => [:db, :web, :crawler] do
    web_launch
    update_discoverer_dependencies
    # Since notifier is a dependency of web, it is now part of update_dependencies wich will be run as part of web_launch 
    update_indexer_dependencies
    update_recommender_dependencies
    update_scheduler_dependencies
    discoverer_restart
    indexer_restart
    notifier_restart
    scheduler_restart
  end

  task :relink_core, :roles => [:db, :web, :crawler] do
    run "cd #{latest_release}/#{core_path} && npm link FastLegS"
    run "cd #{latest_release}/#{core_path} && npm update"
  end

  task :migrate, :roles => [:db] do
    run "touch #{previous_release}/#{migration_path}/migrations/.migrate && cp #{previous_release}/#{migration_path}/migrations/.migrate #{latest_release}/#{migration_path}/migrations/.migrate"
    run "cd #{latest_release}/#{migration_path} && LEDE_DB=production ./node_modules/migrate/bin/migrate"
  end

  task :nuke_db, :roles => [:db] do
    run "cd #{latest_release}/#{migration_path} && LEDE_DB=production ./node_modules/migrate/bin/migrate down"
  end

  task :rebuild_bookmarklet, :roles => [:web] do
    update_bookmarklet_dependencies
    run "cd #{latest_release}/#{bookmarklet_source_path} && make clean && make SERVER_ADDRESS=unburythelede.com && make install"
  end

  task :update_server_dependencies, :roles => [:db, :web, :crawler] do
    run "cd #{latest_release}/#{web_app_path}/server && npm install"
  end

  task :update_app_dependencies, :roles => [:web] do
    run "cd #{latest_release}/#{web_app_path} && npm install"
  end

  task :update_migrate_dependencies, :roles => [:db] do
    run "cd #{latest_release}/#{migration_path} && npm install"
  end

  task :update_discoverer_dependencies, :roles => [:crawler] do
    run "cd #{latest_release}/#{discoverer_path} && npm install"
  end

  task :update_indexer_dependencies, :roles => [:crawler] do
    run "cd #{latest_release}/#{indexer_path} && npm install"
  end

  task :update_notifier_dependencies, :roles => [:crawler, :web, :db] do
    run "cd #{latest_release}/#{notifier_path} && npm install"
  end

  task :update_recommender_dependencies, :roles => [:db] do
    run "cd #{latest_release}/#{recommender_path} && npm install"
  end


  task :update_scheduler_dependencies, :roles => [:crawler] do
    run "cd #{latest_release}/#{scheduler_path} && npm install"
  end

  task :update_bookmarklet_dependencies, :roles => [:web] do
    run "cd #{latest_release}/#{bookmarklet_source_path} && npm install"
  end

  task :rolling_restart, :roles => [:web] do
    run "cd #{current_path}/#{web_app_path} && node ./server/server.js restart #{cluster_size} /var/run/express-cluster.pid"
  end

  task :fast_restart, :roles => [:web] do
    begin 
      run "cd #{server_path} && LEDE_HOME=#{current_path}/src node server.js stop #{current_path}/#{web_app_path}/app.js #{cluster_size} /var/run/express-cluster.pid"
    rescue => e
      p "Looks like the server wasn't running, we'll just start it."
    end
    run "cd #{server_path} && LEDE_HOME=#{current_path}/src node server.js start #{current_path}/#{web_app_path}/app.js #{cluster_size} /var/run/express-cluster.pid"
  end

  task :discoverer_restart, :roles => [:crawler] do
    begin 
      run "cd #{server_path} && LEDE_HOME=#{current_path}/src node server.js stop #{current_path}/#{discoverer_path}/discoverer.js 1 /var/run/discoverer-cluster.pid"
    rescue => e
      p "Looks like the server wasn't running, we'll just start it."
    end
    run "cd #{server_path} && LEDE_HOME=#{current_path}/src node server.js start #{current_path}/#{discoverer_path}/discoverer.js  1 /var/run/discoverer-cluster.pid"
  end

  task :indexer_restart, :roles => [:crawler] do
    begin 
      run "cd #{server_path} && LEDE_DB=production LEDE_HOME=#{current_path}/src node server.js stop #{current_path}/#{indexer_path}/indexer.js 1 /var/run/indexer-cluster.pid"
    rescue => e
      p "Looks like the server wasn't running, we'll just start it."
    end
    if ENV['DEBUG']
      run "cd #{server_path} && DEBUG=true LEDE_DB=production LEDE_HOME=#{current_path}/src node server.js start #{current_path}/#{indexer_path}/indexer.js 1 /var/run/indexer-cluster.pid"
    else
      run "cd #{server_path} && LEDE_HOME=#{current_path}/src node server.js start #{current_path}/#{indexer_path}/indexer.js 1 /var/run/indexer-cluster.pid"
    end
  end

  task :notifier_restart, :roles => [:crawler] do
    begin 
      run "cd #{server_path} && LEDE_HOME=#{current_path}/src node server.js stop #{current_path}/#{notifier_path}/notifier.js 1 /var/run/notifier-cluster.pid"
    rescue => e
      p "Looks like the server wasn't running, we'll just start it."
    end
    run "cd #{server_path} && LEDE_HOME=#{current_path}/src node server.js start #{current_path}/#{notifier_path}/notifier.js 1 /var/run/notifier-cluster.pid"
  end

  task :scheduler_restart, :roles => [:crawler] do
    begin 
      run "cd #{server_path} && LEDE_HOME=#{current_path}/src node server.js stop #{current_path}/#{scheduler_path}/scheduler.js 1 /var/run/scheduler-cluster.pid"
    rescue => e
      p "Looks like the server wasn't running, we'll just start it."
    end
    run "cd #{server_path} && LEDE_HOME=#{current_path}/src node server.js start #{current_path}/#{scheduler_path}/scheduler.js 1 /var/run/scheduler-cluster.pid"
  end

  task :update_dependencies, :roles => [:db, :web, :crawler] do
    update_notifier_dependencies
    update_migrate_dependencies
    update_server_dependencies
    update_app_dependencies
  end

end
