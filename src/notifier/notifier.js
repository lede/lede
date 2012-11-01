var nodemailer = require('nodemailer');
settings = require('../core/settings').get("indexer");
log = require('../core/logger').getLogger("indexer");
var util = require('util');
var dataLayer = require('../core/datalayer');
var _ = require('underscore');
var errors = require('../core/errors.js');
var handlebars = require('handlebars');
var fs = require('fs');

var source = fs.readFileSync('views/notification.hjs', 'utf8');

var template = handlebars.compile(source);
var data = {
  firstname: 'Justin',
  ledes: [
    {url: 'https://www.google.com',title: 'Google!'},
    {url: 'https://www.poop.com',title: 'Poop!'},
    {url: 'https://www.apple.com',title: 'Apple!'}
  ]
};
var result = template(data);

var smtpTransport = nodemailer.createTransport("SMTP",{
  service: "SendGrid",
  auth: {
    user: settings.notifier.username,
    pass: settings.notifier.password
  }
});

var mailOptions = {
  from: 'jon@unburythelede.com',
  to: 'justin@unburythelede.com',
  subject: 'Lede Notifier: Test from development',
  html: result
};

smtpTransport.sendMail(mailOptions, function(err, res) {
  if(err) {
    console.log(err);
  } else {
    console.log("Message sent: " + res.message);
  }
  smtpTransport.close();
});
