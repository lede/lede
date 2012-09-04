exports.parse = function(mimeType) {
  var o = {};

  // from RFC4288
  var r = /^(([A-Za-z0-9!#$&.+\-^_]+)\/([A-Za-z0-9!#$&.+\-^_]+))/.exec(mimeType);

  o.mimeType = r[1];
  o.type = r[2];
  o.subtype = r[3];

  // TODO parse parameters
  return o;
}
