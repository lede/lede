
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , lede = require('./controllers/lede')
  , posts_dashboard = require('./controllers/posts_dashboard')
  , sources_dashboard = require('./controllers/sources_dashboard')
  , _ = require('underscore')
  , redis_store = require('connect-redis')(express)
  , redis = require('redis').createClient()
  , _ = require('underscore')
  , log = require('../../core/logger').getLogger("web")
  , ensure_user = require('./middleware/user.js').ensure_user
  , user = require('./controllers/user.js');

// handle top-level exceptions
process.on('uncaughtException',function(error){
  log.fatal('Top-Level Uncaught Exception: ' + error);
  log.fatal(error.stack);
  log.fatal('Exiting in 10 seconds...');
  setTimeout(function() {
    log.fatal('Exiting.');
    process.exit(1);
  }, 10000);
});

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'hjs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(express.session({
    store: new redis_store({
      client: redis
    })
  }));
  app.use(app.router);
  app.use(require('less-middleware')({ src: __dirname + '/public' }));
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);

// super simple handler for lead posts
// TODO: clean up api routing at some point
// TODO: only accept PUT - this is just for testing
app.all('/api/lede', ensure_user, lede.create);

app.get('/dashboard/total_posts', posts_dashboard.total_posts);
app.get('/dashboard/total_posts/:days', posts_dashboard.total_posts_by_day);

app.get('/dashboard/total_sources', sources_dashboard.total_sources);
app.get('/dashboard/total_sources/:days', sources_dashboard.total_sources_by_day);

app.get('/user/login', user.login);
app.get('/user/logout', user.logout);
app.get('/user/whoami', user.whoami);
app.get('/user/register', user.register);

http.createServer(app).listen(app.get('port'), function(){
  log.info("Express server listening on port " + app.get('port'));
});
