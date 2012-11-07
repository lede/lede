settings = require('../core/settings').get("notifier");
log = require('../core/logger').getLogger("notifier");
var _ = require('underscore');
var util = require('util');
var handlebars = require('handlebars');
var fs = require('fs');
var nodemailer = require('nodemailer');
var dataLayer = require('../core/datalayer');
var errors = require('../core/errors.js');

//resolve a user id to a user object
function get_user(userid, cb) {
  dataLayer.User.findOne(userid, {only: ['id','email']}, function(err, user) {
    if(err) {
      log.error(err);
    } else if(user) {
      cb(user);
    }
  });
}

//resolve an array of post ids to an array of post objects (culled for id,uri,title)
function get_posts(postids, cb){
  dataLayer.Post.find(postids, {only: ['id','uri','title']}, function(err, posts) {
    if(err) {
      log.error(err);
    } else if(posts) {
      cb(posts);
    }
  });
}

//use the user and posts informtion to generate the content of the email
function generate_daily_options (user,posts) {
  var source = fs.readFileSync('views/notification.hjs', 'utf8');
  var template = handlebars.compile(source);
  var mail_html = template({ledes: posts});

  var mail_options = {
    from: "jon@unburythelede.com",
    to: user.email,
    subject: "Test from Dev: Lede",
    html: mail_html
  };

  return mail_options;
}

//use the user and posts informtion to generate the content of the email
function generate_welcome_options (user,temp_password) {
  var source = fs.readFileSync('views/welcome.hjs', 'utf8');
  var template = handlebars.compile(source);
  var mail_html = template({password: temp_password, username: user.email});

  var mail_options = {
    from: "jon@unburythelede.com",
    to: user.email,
    subject: "Test from Dev: Lede",
    html: mail_html
  };

  return mail_options;
}

//actually call the mailer to hit sendgrid
function send_email(mailOptions) {
  // set up mailer
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
      return;
    }
  });

  smtpTransport.close();
}

// wrap it all up.  resolve userid and postids, generate email and send it
exports.send_daily = function(userid, postids) {
  get_user(userid, function(user) {
    log.debug('Found user ' + user.email);
    get_posts(postids, function(posts) {
      log.debug('Found posts');
      var mail_options = generate_daily_options(user,posts);
      log.debug(mail_options);
      send_email(mail_options);
    });
  });
};

// wrap it all up.  resolve userid, generate email and send it
exports.send_welcome = function(userid, temp_password) {
  get_user(userid, function(user) {
    log.debug('Found user ' + user.email);
    var mail_options = generate_welcome_options(user,temp_password);
    log.debug(mail_options);
    send_email(mail_options);
  });
};
