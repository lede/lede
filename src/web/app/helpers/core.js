
// emit a standard 500 server error response given an error object
function generic_error(res, err) {
  // TODO: better error message, status code
  res.status(500); // generic server fail
  res.send({ result: 'Server Error: ' + err });
}

// functor to wrap a callback, automatically invoke a standard 500 error response on error,
// and pass along just the result arg on success
function no_err(res, cb) {
  return function(err, data) {
    if(err) {
      generic_error(res, err);
    } else {
      cb(data);
    }
  }
}
