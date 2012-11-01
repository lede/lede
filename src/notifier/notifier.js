var nodemailer = require('nodemailer');
settings = require('../core/settings').get("indexer");
log = require('../core/logger').getLogger("indexer");
var util = require('util');
var dataLayer = require('../core/datalayer');
var _ = require('underscore');
var errors = require('../core/errors.js');
var handlebars = require('handlebars');
var fs = require('fs');

// set up mailer
var smtpTransport = nodemailer.createTransport("SMTP", {
  service: "SendGrid",
  auth: {
    user: settings.notifier.username,
    pass: settings.notifier.password
  }
});

//Hack: aribritrary data
//create_email(1,[41,42,43,44,45]);
smtpTransport.close();

// here's the magic
function create_email(userid, postids) {
  dataLayer.User.findOne(userid, {only: ['id','email']}, function(err, user) {
    if(err) {
      log.error(err);
    } else if(user) {
      log.info('Found User ' + user.email);
      dataLayer.Post.find(postids, {only: ['id','uri','title']}, function(err, posts) {
        if(err) {
          log.error(err);
        } else if(posts) {
          log.info('Found posts');
          var source = fs.readFileSync('views/notification.hjs', 'utf8');
          var template = handlebars.compile(source);
          var data = {
            firstname: user.email,
            ledes: posts
          };
          var mail_html = template(data);

          var mail_options = {
            from: "jon@unburythelede.com",
            to: user.email,
            subject: "Test from Dev: Lede",
            html: mail_html
          };

          log.info(mail_options);
          send_notification(mail_options);
        }
      });
    }
  });
}

function send_notification(mailOptions) {
  smtpTransport.sendMail(mailOptions, function(err, res) {
    if(err) {
      log.info(err);
    } else {
      log.info("Message sent: " + res.message);
    }
  });
}
