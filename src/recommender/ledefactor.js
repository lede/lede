var dataLayer = require('../core/datalayer');
var _ = require('underscore');
var Step = require('step');

function getLedeFactor(postId, callback) {
}

/** returns an array of the number of backlinks, with each level deeper into the hierarchy being the next index in the array (index 0 are the number of direct backlinks to the specified post)
 * @param postId  ID of the post to search for backlinks to
 * @param depth  how many levels down the hierarchy of backlinks to traverse (0 == just first-level links)
 * @param callback  the callback to call with the results.  it receives an array, with index 0 being the number of first-level links, etc
 */
function getNumBacklinks(postId, depth, callback) {
  Step(
    function () {
      dataLayer.Post.findOne(postId, { only: ['uri'] }, this);
    },
    function (err, result) {
      if (err) {
        throw err;
      }

      getBacklinks(result.uri, this);
    },
    function (err, backlinks) {
      if (err) {
        throw err;
      }

      if (depth > 0) {
        var group = group();
        _.each(backlinks, function (backlink) {
          getNumBacklinks(backlink.from_post_id, depth - 1, group());
        });
      }

      return backlinks.length;
    },
    function (err, result) {
      if (err) {
        throw err;
      }
      console.log(result);
    }/*,
    callback*/
  );
}

function getBacklinks(postUrl, callback) {
  dataLayer.Link.find({
    uri: postUrl
  },
  {
    only: ['id', 'from_post_id']
  },
  callback);
}

exports.getNumBacklinks = getNumBacklinks;
