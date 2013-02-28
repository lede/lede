var User = require('../core/datalayer').User;
var _ = require('underscore');
var dataLayer = require('../core/datalayer');
var notifier = require('../notifier/notifier');
var util = require('util');
var Step = require('step');

function sendDailyEmails(done) {
	// Get all users
  log.info('Starting email generation process for all users...');

  dataLayer.User.find({}, { only: ['id', 'email'] }, function(err, users) {
    if(err) {
      log.error('Error getting user ids: ' + err);
      done(err);
    } else {
      log.debug('Got result from user id lookup, found : ' + util.inspect(users));
      Step(
        function () {
          var group = this.group();

          _.each(
            users,
            function (user) { 
              sendDailyEmailForUser(user, group());
            }
          );
        },
        done
      );
    }
  });
}

/** send an email for one user.  marks the recommendations that are sent as 'sent'
 * @param user  the user object to send to.  must contain attributes for 'id' and 'email'
 * @param editorsPicksLedes  editor's picks Ledes (common to all users for today's email)
 * @param mostPopularLedes  Ledes most common among all users (common to all users for today's email)
 * @param done  the callback.  there is no results param, only error
 */
function sendDailyEmailForUser(user, done) {
  fetchLedesForUser(user.id, settings.recommender.numberOfLedes, function(err, ledes) {
    if(err) {
      log.error('Error finding Ledes for user ' + user.id + ' : ' + err);
      done(err);
    } else {
      log.info('Sending email to user ' + user.id + ' (' + user.email + ') with ' + ledes.length + ' links');
      notifier.send_daily(user, ledes, function (err, notification) {
        if (err) {
          done(err);
        } else {
          // mark the recommendations as sent
          if(ledes.length > 0) {
            dataLayer.Recommendation.update(_.pluck(ledes, 'id'), { sent: true, sent_notification_id: notification.id }, done);
          } else {
            done();
          }
        }
      });
    }
  });
}

/** fetches Ledes for the specified user, up to a max of 'limit'.  Will fetch the oldest ones first
 * @param userId the user to fetch for
 * @param limit  the max number of Ledes to fetch
 * @done  callback.  result is array of Ledes
 */
function fetchLedesForUser(userId, limit, done) {
  log.debug('Fetching ledes for user: ' + userId);
  dataLayer.Recommendation.find({ user_id: userId, sent: false }, { order: ['created_at'], limit: limit }, done);
}

/** fetches Ledes from those queued for users who have admin=true.  we use Ledes queued instead of stories covered because people can cover garbage and we don't have a clean way of fixing it or detecting it right now.  For the Editor's picks, and possibly also the Most Popular, I think "covered" would produce better results
 * @param limit  the max number of Ledes to fetch
 */
function fetchEditorsPicks(limit, done) {
  dataLayer.client.emit('query', "SELECT rec.title, rec.uri, rec.description, rec.author, rec.image_url FROM Recommendations rec JOIN (SELECT DISTINCT uri FROM (SELECT r.uri FROM Recommendations r JOIN Users u ON r.user_id = u.id AND u.admin = TRUE ORDER BY r.created_at DESC) AS rec LIMIT $1) AS picks ON rec.uri = picks.uri", [limit], function(err, result) {
    if (err) {
      done(err);
    } else {
      done(null, result.rows);
    }
  });
}

function fetchMostPopular(limit, done) {
  // TODO actually run query here, figure out date math to get last 24 hours
  "SELECT r.uri, count(r.uri) FROM Recommendations r WHERE r.created_at > yesterday GROUP BY r.uri ORDER BY count(r.uri) DESC LIMIT :1"

  // ditto
  "SELECT r.title, r.uri, r.description, r.author, r.image_url FROM Recommendations r WHERE r.id IN (:1)" // param is IDs from above query
}

exports.sendDailyEmails = sendDailyEmails;
exports.sendDailyEmailForUser = sendDailyEmailForUser;
exports.fetchEditorsPicks = fetchEditorsPicks;
