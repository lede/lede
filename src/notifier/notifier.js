var email = require('mailer');
var dataLayer = require('../core/datalayer');
var sgusername = 'lede';
var sgpassword = 'Passw0rd!';

var view = {
  firstname: 'Jon',
  animal: 'shark',
  things: 'tables'
};

email.send({
  host: 'smtp.sendgrid.net',
  port: '587',
  domain: 'unburythelede.com',
  template: 'views/digest.hjs',
  data: view,
  to: 'jonathan.hayden@gmail.com',
  from: 'jon@unburythelede.com',
  subject: 'Test from my dev enviornment',
  authentication: 'login',
  username: sgusername,
  password: sgpassword
},
function(err, res){
  if(err){
    console.log(err);
  }
});
