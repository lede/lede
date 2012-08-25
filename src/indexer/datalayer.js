var FastLegS = require('FastLegS');
var settings = require('./' + process.argv[2]); // TODO hack!

exports.client = FastLegS.connect(settings.dbConnectionParams).client;
exports.client.client.on('error', function(e) {
  log.fatal("Database connection error: " + e.message);
  process.exit(1);
});

exports.Feed = FastLegS.Base.extend({
  tableName: "feeds",
  primaryKey: "id",
  updateTimestamp: "updated_at",
  createTimestamp: "created_at"
});

exports.PostContent = FastLegS.Base.extend({
  tableName: "post_contents",
  primaryKey: "id",
  updateTimestamp: "updated_at",
  createTimestamp: "created_at"
});

exports.Post = FastLegS.Base.extend({
  tableName: "posts",
  primaryKey: "id",
  updateTimestamp: "updated_at",
  createTimestamp: "created_at",
  one: [{
    content: exports.PostContent,
    joinOn: 'post_content_id'
  }]
});

exports.PostWithContent = FastLegS.Base.extend({
  tableName: "post_with_content_view",
  primaryKey: "post_id"
});

exports.Subscription = FastLegS.Base.extend({
  tableName: "subscriptions",
  primaryKey: "id",
  updateTimestamp: "updated_at",
  createTimestamp: "created_at"
});

exports.SubscriptionFolder = FastLegS.Base.extend({
  tableName: "subscription_folders",
  primaryKey: "id",
  updateTimestamp: "updated_at",
  createTimestamp: "created_at",
  many: [{
    subscriptions: exports.Subscription,
    joinOn: 'subscription_folder_id'
  }]
});

