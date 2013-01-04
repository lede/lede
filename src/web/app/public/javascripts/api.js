// API wrapper for express REST-y API
// TODO: flesh out API
var api = {
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
    }
  }
};
