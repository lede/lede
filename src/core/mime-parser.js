// Splits the mime type on slash and returns an object comprising the 
// mime type, type, and subtype, or null if we could not parse one
exports.parse = function(mimeType) {
  var mimeParts = {};

  // from RFC4288
  var splitMimeType = /^(([A-Za-z0-9!#$&.+\-^_]+)\/([A-Za-z0-9!#$&.+\-^_]+))/.exec(mimeType);

  if(!splitMimeType || splitMimeType.length < 4) {
  	return null;
  }

  mimeParts.mimeType = splitMimeType[1];
  mimeParts.type = splitMimeType[2];
  mimeParts.subtype = splitMimeType[3];

  // TODO parse parameters
  return mimeParts;
}
