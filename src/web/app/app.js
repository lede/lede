settings = require('../../core/settings').get("web");
log = require('../../core/logger').getLogger("web");

/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var util = require('util');
var uuid = require('node-uuid');
var lede = require('./controllers/lede');
var posts_dashboard = require('./controllers/posts_dashboard');
var sources_dashboard = require('./controllers/sources_dashboard');
var links_dashboard = require('./controllers/links_dashboard');
var link = require('./controllers/link');
var post = require('./controllers/post');
var recommendation = require('./controllers/recommendation');
var notification = require('./controllers/notification');
var extractor = require('./controllers/extractor');
var redis_store = require('connect-redis')(express);
var redis = require('redis').createClient();
var _ = require('underscore');
var ensure_user = require('./middleware/user.js').ensure_user;
var user = require('./controllers/user.js');
var email_callback = require('./controllers/email_callback.js');

// handle top-level exceptions
process.on('uncaughtException',function(error){
  console.log('Top-Level Uncaught Exception: ' + error);
  log.fatal(error.stack);
  log.fatal('Exiting in 0 seconds...');
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

app.get('/', routes.index);

// super simple handler for lead posts
// TODO: clean up api routing at some point
// NOTE: we have to accept GET here because we're using image requests as a cross-site hack
// NOTE: this endpoint does its own valid-user checking because it does some hackalicious stuff with the response pixel
app.all('/api/lede', lede.create);

app.get('/api/ledes', ensure_user, lede.list);

app.get('/dashboard/total_posts', posts_dashboard.total_posts);
app.get('/dashboard/total_posts/:days', posts_dashboard.total_posts_by_day);

app.get('/dashboard/total_sources', sources_dashboard.total_sources);
app.get('/dashboard/total_sources/:days', sources_dashboard.total_sources_by_day);

app.get('/dashboard/total_links', links_dashboard.total_links);
app.get('/dashboard/total_links/:days', links_dashboard.total_links_by_day);

app.get('/api/link/from_post/:from_post_id', link.links_from_post);

app.get('/api/post/:id', post.get);

app.post('/api/user/login', user.login);
app.post('/api/user/logout', ensure_user, user.logout);
app.get('/api/user/whoami', ensure_user, user.whoami);
app.put('/api/user/register', user.register);
app.get('/api/user', ensure_user, user.findAll);
app.get('/api/user/:user_id', ensure_user, user.findOne);

app.get('/api/recommendation', ensure_user, recommendation.list);
app.post('/api/recommendation', ensure_user, recommendation.create);
app.post('/api/recommendation/send_daily', ensure_user, recommendation.sendDailyEmailForUser);
app.delete('/api/recommendation/:recommendation_id', ensure_user, recommendation.remove);

app.get('/api/notification', ensure_user, notification.list);
app.post('/api/notification', ensure_user, notification.create);

app.post('/api/extractor/extract', ensure_user, extractor.extract);
app.post('/api/extractor/createThumbnail', ensure_user, extractor.createThumbnail);

app.post('/api/email_callback', email_callback.process);

app.use(function (err, req, res, next) { // error handler (must have arity 4)
  log.error(err.stack);
  res.send(500, 'Server Error');
});

http.createServer(app).listen(app.get('port'), function(){
  log.info("Express server listening on port " + app.get('port'));
  if(process.env['DEBUG']) {
    log.info("Using settings: " + util.inspect(settings));
  }
});
