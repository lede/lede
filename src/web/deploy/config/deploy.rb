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

# this tells capistrano what to do when you deploy
namespace :deploy do

  desc <<-DESC
  A macro-task that updates the code and fixes the symlink.
  DESC
  task :default do
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
    migrate
    deploy
  end

  task :migrate do
    # really shaky relative paths - TODO: fix
    `cd ../../db/ && ./node_modules/db-migrate/bin/db-migrate up --config database.json -e production`
  end

end


