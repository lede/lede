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
    list: function(userid, success, error) {
      $.ajax({
        url: '/api/ledes',
        data: {userid: userid},
        dataType: "json",
        success: function(data) {
          success(data.ledes);
        },
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
    list: function(success, error) {
      $.ajax({
        url: '/api/user',
        type: 'GET',
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
          console.log(obj.responseText);
          error(obj);
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
  notifier: {
    sendDaily: function(user, success, error) {
      $.ajax({
        url: '/api/notifier/send_daily',
        type: 'POST',
        datatype: 'json',
        data: user,
        success: success,
        error: error
      });
    }
  }
};
