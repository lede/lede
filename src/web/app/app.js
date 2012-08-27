
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
  , _ = require('underscore');

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
app.all('/api/lede', lede.create);

app.get('/dashboard/total_posts', posts_dashboard.total_posts);
app.get('/dashboard/total_posts/:days', posts_dashboard.total_posts_by_day);

app.get('/dashboard/total_sources', sources_dashboard.total_sources);
app.get('/dashboard/total_sources/:days', sources_dashboard.total_sources_by_day);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
