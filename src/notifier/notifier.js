var email = require('mailer');
var settings = require('../core/settings');
var dataLayer = require('../core/datalayer');

var view = {
  firstname: 'Jon',
  animal: 'shark',
  things: 'tables'
};

email.send({
  host: settings.notifier.host,
  port: settings.notifier.port,
  domain: settings.notifier.domain,
  authentication: settings.notifier.authentication,
  username: settings.notifier.username,
  password: settings.notifier.password,
  template: 'views/digest.hjs',
  data: view,
  to: 'justin@unburythelede.com',
  from: 'jon@unburythelede.com',
  subject: 'Lede Notifier: Test from development',
},
function(err, res){
  if(err){
    console.log(err);
  }
});
