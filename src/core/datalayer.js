var FastLegS = require('FastLegS');

// TODO I suspect this only uses one DB connection per process, and we might get better throughput if we had more than one (at least one per worker)

function DatabaseError(message) {
  this.name = "DatabaseError";
  this.message = message || "A database error occurred";
}

DatabaseError.prototype = new Error();
DatabaseError.prototype.constructor = DatabaseError;

exports.DatabaseError = DatabaseError;

exports.client = FastLegS.connect(settings.dbConnectionParams).client;
exports.client.client.on('error', function(e) {
  log.fatal("Database connection error: " + e.message);
  process.exit(1);
});

exports.Source = FastLegS.Base.extend({
  tableName: "sources",
  primaryKey: "id",
  updateTimestamp: "updated_at",
  createTimestamp: "created_at"
});

exports.Post = FastLegS.Base.extend({
  tableName: "posts",
  primaryKey: "id",
  updateTimestamp: "updated_at",
  createTimestamp: "created_at"
});

exports.User = FastLegS.Base.extend({
  tableName: "users",
  primaryKey: "id",
  updateTimestamp: "updated_at",
  createTimestamp: "created_at"
});

exports.Link = FastLegS.Base.extend({
  tableName: "links",
  primaryKey: "id",
  updateTimestamp: "updated_at",
  createTimestamp: "created_at",
  one: [{
    from_post: exports.Post,
    joinOn: 'from_post_id'
  }]
});

exports.Lede = FastLegS.Base.extend({
  tableName: "ledes",
  primaryKey: "id",
  updateTimestamp: "updated_at",
  createTimestamp: "created_at",
  belongsTo: [  {
    user: exports.User,
    joinOn: 'user_id'
  }]
});

exports.Reason = FastLegS.Base.extend({
  tableName: "reasons",
  primaryKey: "id",
  updateTimestamp: "updated_at",
  createTimestamp: "created_at"
});

exports.Blacklist = FastLegS.Base.extend({
  tableName: "blacklists",
  primaryKey: "id",
  updateTimestamp: "updated_at",
  createTimestamp: "created_at",
  one: [{
    reason: exports.Reason,
    joinOn: 'reason_id'
  }]
});

exports.Recommendation = FastLegS.Base.extend({
  tableName: "recommendations",
  primaryKey: "id",
  updateTimestamp: "updated_at",
  createTimestamp: "created_at",
  belongsTo: [{
    user: exports.User,
    joinOn: 'user_id'
  },
  {
    user: exports.User,
    joinOn: 'created_by_user_id'
  }]
});
