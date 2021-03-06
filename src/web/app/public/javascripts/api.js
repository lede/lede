// API wrapper for express REST-y API
// TODO: flesh out API
api = {
  link: {
    fromPost: function(id, success, error) {
      $.ajax({
        url: '/api/link/from_post/' + id,
        dataType: "json",
        success: success,
        error: error
      });
    }
  },
  post: {
    get: function(id, success, error) {
      $.ajax({
        url: '/api/post/' + id,
        dataType: "json",
        success: success,
        error: error
      });
    }
  },
  lede: {
    list: function(options, success, error) {
      $.ajax({
        url: '/api/ledes',
        data: options,
        dataType: "json",
        success: success,
        error: function (obj) {
          error(JSON.parse(obj.responseText));
        }
      });
    }
  },
  user: {
    login: function(credentials, success, error) {
      $.ajax({
        url: '/api/user/login',
        data: credentials,
        type: 'POST',
        dataType: "json",
        success: success,
        error: function (obj) {
          error(JSON.parse(obj.responseText));
        }
      });
    },
    list: function(options, success, error) {
      $.ajax({
        url: '/api/user',
        data: options,
        success: success,
        error: function (obj) {
          error(JSON.parse(obj.responseText));
        }
      });
    },
    find: function(user_id, success, error) {
      $.ajax({
        url: '/api/user/' + user_id,
        type: 'GET',
        success: success,
        error: function (obj) {
          error(JSON.parse(obj.responseText));
        }
      });
    },
    check: function(success, error) {
      $.ajax({
        url: '/api/user/whoami',
        success: success,
        error: error
      });
    },
    register: function(email, success, error) {
      $.ajax({
        url: '/api/user/register',
        data: {
          user_email: email
        },
        type: 'PUT',
        success: success,
        error: function(obj) {
          error(JSON.parse(obj.responseText));
        }
      });
    },
    apikey: function(options, success, error) {
      $.ajax({
        url: '/api/user/apikey',
        data: options,
        success: success,
        error: function (obj) {
          error(JSON.parse(obj.responseText));
        }
      });
    }
  },
  recommendation: {
    list: function(options, success, error) {
      $.ajax({
        url: '/api/recommendation',
        data: options,
        success: success,
        error: error
      });
    },
    create: function(recommendation, success, error) {
      $.ajax({
        url: '/api/recommendation',
        type: 'POST',
        datatype: 'json',
        data: recommendation,
        success: success,
        error: error
      });
    },
    remove: function(recommendation_id, success, error) {
      $.ajax({
        url: '/api/recommendation/' + recommendation_id,
        type: 'DELETE',
        success: success,
        errorr: error
      });
    },
    sendDaily: function(user, success, error) {
      $.ajax({
        url: '/api/recommendation/send_daily',
        type: 'POST',
        datatype: 'json',
        data: user,
        success: success,
        error: error
      });
    }
  },
  story: {
    list: function(options, success, error) {
      $.ajax({
        url: '/api/story',
        data: options,
        success: success,
        error: error
      });
    },
    create: function(story, success, error) {
      $.ajax({
        url: '/api/story',
        type: 'POST',
        datatype: 'json',
        data: story,
        success: success,
        error: error
      });
    },
    update: function(story, success, error) {
      $.ajax({
        url: '/api/story/' + story.id,
        type: 'PUT',
        datatype: 'json',
        data: story,
        success: success,
        error: error
      });
    },
    remove: function(story_id, success, error) {
      $.ajax({
        url: '/api/story/' + story_id,
        type: 'DELETE',
        success: success,
        errorr: error
      });
    }
  },
  notification: {
    list: function(options, success, error) {
      $.ajax({
        url: '/api/notification',
        data: options,
        success: success,
        error: error
      });
    },
    create: function(notification, success, error) {
      $.ajax({
        url: '/api/notification',
        type: 'POST',
        datatype: 'json',
        data: notification,
        success: success,
        error: error
      });
    }
  },
  extractor: {
    extract: function(recommendation, success, error) {
      $.ajax({
        url: '/api/extractor/extract',
        type: 'POST',
        datatype: 'json',
        data: recommendation,
        success: success,
        error: error
      });
    },
    createThumbnail: function(image, success, error) {
      $.ajax({
        url: '/api/extractor/createThumbnail',
        type: 'POST',
        datatype: 'json',
        data: image,
        success: success,
        error: error
      });
    }
  }
};
