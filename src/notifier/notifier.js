var settings = require('../core/settings').get("notifier");
var log = require('../core/logger').getLogger("notifier");
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
    from: "Lede <hello@unburythelede.com>",
    to: user.email,
    subject: "Your Daily Ledes, Sunday Edition",
    html: mail_html
  };

  send_email(user, mail_options, callback);
}

// Send the daily email formatted for use with ledes
function generate_daily_email(user, posts, callback) {
  var header_filename = "daily_header_with_ledes";

  if(posts.length <= 0) {
    header_filename = "daily_header_without_ledes";
  }

  var header_source = fs.readFileSync(__dirname + '/views/' + header_filename + '.hjs', 'utf8');
  var header_template = handlebars.compile(header_source);

  var title_copy = "Your Daily Ledes";
  var source = fs.readFileSync(__dirname + '/views/daily.hjs', 'utf8');
  var template = handlebars.compile(source);
  var mail_html = template({page_title: title_copy, ledes: posts, subheader: header_template});

  send_daily_email(user, mail_html, callback);
}

// Use the user and posts information to generate the content of the daily email and send it
function generate_and_send_daily_email (user, posts, callback) {
    generate_daily_email(user, posts, callback);
}

// Use the user and password informtion to generate a welcome email and send it
function send_welcome_email (user, temp_password, callback) {
  var source = fs.readFileSync(__dirname + '/views/welcome.hjs', 'utf8');
  var template = handlebars.compile(source);
  var mail_html = template({password: temp_password, username: user.email});

  var mail_options = {
    from: "The Lede Team <hello@unburythelede.com>",
    to: user.email,
    subject: "Welcome to Lede!",
    html: mail_html
  };

  send_email(user, mail_options, callback);
}

// Sent the constructed email to the customer through the email service provider
// This will overwrite SMTP headers so do all that shit here
function send_email(user, mail_options, callback) {
  mail_options.generateTextFromHTML = true;

  // Set up mailer
  var smtpTransport = nodemailer.createTransport("SMTP", {
    service: settings.notifier.service,
    auth: {
      user: settings.notifier.username,
      pass: settings.notifier.password
    }
  });

  dataLayer.Notification.create({user_id: user.id, created_by_user_id: 0}, function(err, inserted_notifications) {
    if(err) {
      log.error('Failed to create record in the notifications table');
      callback(err);
    } else if (inserted_notifications && inserted_notifications.rows.length) {
      var inserted_notification = inserted_notifications.rows[0];
      mail_options.headers = {'X-SMTPAPI': {unique_args: {notification_id: inserted_notification.id}}};
      smtpTransport.sendMail(mail_options, function(err, inserted_notification) {
        if(err) {
          log.error(err);
          callback(err);
        } else {
          callback(err, inserted_notification);
        }
      });
    } else {
      log.error("We should not have gotten here so something is dicked");
    }
  });

  smtpTransport.close();
}

// Wrap it all up. Resolve userid and postids, generate email, and send it
exports.send_daily = function(user, posts, callback) {
  generate_and_send_daily_email(user, posts, callback);
};

// Wrap it all up. Resolve userid, generate email, and send it
exports.send_welcome = function(userid, temp_password, callback) {
  get_user(userid, function(user) {
    log.debug('Found user ' + user.email);
    send_welcome_email(user, temp_password, callback);
  });
};
