function ConnectionError(message) {
  this.name = "ConnectionError";
  this.message = message || "A connection error occurred";
}

ConnectionError.prototype = new Error();
ConnectionError.prototype.constructor = ConnectionError;

exports.ConnectionError = ConnectionError;
