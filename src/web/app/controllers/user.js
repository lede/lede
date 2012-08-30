

exports.login = function(req, res) {
  // TODO: implement
  res.status = 500;
  res.send({ result: 'Not Yet Implemented' });
}

exports.logout = function(req, res) {
  if(req.session) {
    req.session.destroy(function() {});
    res.send({ result: 'Logged Out' });
  }
}

exports.whoami = function(req, res) {
  if(req.session && req.session.user) {
    // TODO: implement
    res.send({ result: req.session.user.email });
  }
}

exports.register = function(req, res) {
  // TODO: implement
  res.status = 500;
  res.send({ result: 'Not Yet Implemented' });
}
