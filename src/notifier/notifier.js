settings = require('../core/settings').get("notifier");
log = require('../core/logger').getLogger("notifier");
var _ = require('underscore');
var util = require('util');
var handlebars = require('handlebars');
var fs = require('fs');
var nodemailer = require('nodemailer');
var dataLayer = require('../core/datalayer');
var errors = require('../core/errors.js');

// Resolve a user id to a user object
function get_user(userid, cb) {
  dataLayer.User.findOne(userid, {only: ['id','email']}, function(err, user) {
    if(err) {
      log.error(err);
    } else if(user) {
      cb(user);
    }
  });
}

// Resolve an array of post ids to an array of post objects (culled for id,uri,title)
function get_posts(postids, cb){
  if(_.isEmpty(postids)) {
    log.error("Attempted to resolve empty list of post IDs");
    cb([]);
  }
  dataLayer.Post.find(postids, {only: ['id','uri','title']}, function(err, posts) {
    if(err) {
      log.error(err);
    } else if(posts) {
      cb(posts);
    }
  });
}

// Send the pre formatted daily email
function send_daily_email(user, mail_html, callback) {
  var mail_options = {
    from: "hello@unburythelede.com",
    to: user.email,
    subject: "Your new Ledes",
    html: mail_html
  };

  send_email(mail_options, callback);
}

// Send the daily email formatted for use with ledes
function generate_daily_email_with_ledes(user, posts, callback) {
  var source = fs.readFileSync(__dirname + '/views/daily.hjs', 'utf8');
  var template = handlebars.compile(source);
  var mail_html = template({ledes: posts});

  send_daily_email(user, mail_html, callback);
}

// Send the daily email formatted for use without ledes
function generate_daily_email_without_ledes(user, callback) {
  var source = fs.readFileSync(__dirname + '/views/daily_no_ledes.hjs', 'utf8');
  var template = handlebars.compile(source);

  var links = 
  [
    {"uri": "http://cat-blog.tumblr.com/", "title": "A totally normal blog"},
    {"uri": "http://www.theonion.com/", "title": "Some super serious world news"},
    {"uri": "http://somerville.patch.com/", "title": "News from the Lede stomping ground"}
  ]

  var mail_html = template({suggestions: links});

  send_daily_email(user, mail_html, callback);
}

// Use the user and posts information to generate the content of the daily email and send it
function generate_and_send_daily_email (user, posts, callback) {
  if(posts && posts.length > 0) {
    generate_daily_email_with_ledes(user, posts, callback);
  } 

  generate_daily_email_without_ledes(user, callback);
}

// Use the user and password informtion to generate a welcome email and send it
function send_welcome_email (user, temp_password, callback) {
  var source = fs.readFileSync(__dirname + '/views/welcome.hjs', 'utf8');
  var template = handlebars.compile(source);
  var mail_html = template({password: temp_password, username: user.email});

  var mail_options = {
    from: "hello@unburythelede.com",
    to: user.email,
    subject: "Welcome to Lede!",
    html: mail_html
  };

  send_email(mail_options, callback);
}

// Sent the constructed email to the customer through the email service provider
function send_email(mailOptions, callback) {
  log.debug(mail_options);

  // Set up mailer
  var smtpTransport = nodemailer.createTransport("SMTP", {
    service: settings.notifier.service,
    auth: {
      user: settings.notifier.username,
      pass: settings.notifier.password
    }
  });

  smtpTransport.sendMail(mailOptions, function(err, res) {
    if(err) {
      log.error(err);
    } else {
      log.info("Message sent: " + res.message);
      callback();
    }
  });

  smtpTransport.close();
}

// Wrap it all up. Resolve userid and postids, generate email, and send it
exports.send_daily = function(userid, postids, callback) {
  get_user(userid, function(user) {
    log.debug('Found user ' + user.email);
    get_posts(postids, function(posts) {
      log.debug('Found posts');
      generate_and_send_daily_email(user, posts, callback);
    });
  });
};

// Wrap it all up. Resolve userid, generate email, and send it
exports.send_welcome = function(userid, temp_password, callback) {
  get_user(userid, function(user) {
    log.debug('Found user ' + user.email);
    send_welcome_email(mail_options, callback);
  });
};
