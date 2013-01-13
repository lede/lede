var activeUser = {};
var adminUser = {};

// grab the list of users from the backend
function initPage() {
  $('#user-details').hide();
  api.user.list(function(users) {
    _.each(users, function(user) {
      $('.user-list ul').append(
        '<li>'+
          '<a href="#user/'+user.id+'">'+
            user.email+
          '</a>'+
        '</li>'
      );
    });
  });
}

// grab the list of ledes from the backend
function updateRecommendations(userid, callback) {
  api.recommendation.list({user_id: userid, sent: false}, function(recommendations) {
    var li = recommendations.length ? '' : '<li>Queue up some ledes!</li>'; 
    $('.add-lede ul').html(li);

    _.each(recommendations, function(recommendation) {
      $('.add-lede ul').append(
        '<li>'+
          '<a href="' + recommendation.uri + '" target="_blank">'+
            recommendation.title+
          '</a>'+
        '</li>'
      );
    });
  });
  callback();
}

// grab the list of bookmarklet hits from the backend
function updateLedes(userid, callback) {
  api.lede.list(userid, function(ledes) {
    var li = ledes.length ? '' : '<li>No bookmarklet hits yet. Check back soon!</li>';
    $('.recent-bookmarklets ul').html(li);

    _.each(ledes, function(lede) {
      $('.recent-bookmarklets ul').append(
        '<li>'+
          '<a href="'+lede.uri+'" target="_blank">'+
            lede.uri+
          '</a>'+
        '</li>'
      );
    });
  });
  callback();
}

// render up the user details 
function renderUserDetails(userid) {
  var callbackCount = 2;
  $('#user-details').fadeOut(300);

  updateLedes(userid, function(){
    callbackCount--;
    if(callbackCount === 0) {
      $('#user-details').fadeIn(200);
    }
  });

  updateRecommendations(userid, function(){
    callbackCount--;
    if(callbackCount === 0) {
      $('#user-details').fadeIn(200);
    }
  });

}

$(function() {

  //naive route handling
  var userid;
  function router(newHash, oldHash) {
    if(newHash.match(/user\/[0-9]+/)) {
      userid = newHash.split('/')[1];
      api.user.find(userid, function(user) {
        activeUser = user;
        renderUserDetails(user.id);
      });
    }
  }

  hasher.changed.add(router);
  hasher.initialized.add(router);
  hasher.init();

  api.user.check(function(user) {
    adminUser = user.result;
  }, 
  function() {
    window.location='/login.html';
  });

  initPage();

  // Handler to add ledes
  $('#add-lede-form').submit(function(evt) {
    evt.preventDefault();

    var recommendation = { 
      user_id: userid,
      created_by_user_id: adminUser.id,
      uri: $('input[name=lede-url]').val(),
      title: $('input[name=lede-title]').val(),
      author: $('input[name=lede-author]').val(),
      description: $('input[name=lede-description]').val(),
      image_url: $('input[name=lede-image-url]').val(),
      sent: false
    };

    api.recommendation.create(recommendation, function() {
      updateRecommendations(userid, function() {
        $('input[name=lede-url]').val('');
        $('input[name=lede-title]').val('');
        $('input[name=lede-author]').val('');
        $('input[name=lede-description]').val('');
        $('input[name=lede-image-url]').val('');
      });
    });
  });

  // Handler to look up lede data
  $('#lookup-lede').click(function(evt) {
    evt.preventDefault();
    $('#notification').html(
      '<p>Extracting Lede Details...</p>'+
      '<img src="/images/ajax-loader.gif">'
    );
    $('#notification').fadeIn(200);
    api.extractor.extract({url: $('input[name=lede-url]').val()}, function(recommendation) {
      $('input[name=lede-title]').val(recommendation.title);
      $('input[name=lede-description]').val(recommendation.description);
      $('input[name=lede-image-url]').val(recommendation.image);
      $('#lede-image-preview').html('<img src="'+recommendation.image+'" width="75" height="75">');
      $('#notification').fadeOut(500);
      $('#notification').html('');
    },
    function(err) {
      $('#notification').html('Extracting Lede Information Has Failed.  Check your URL and try again.');
      window.setTimeout(function() {
        $('#notification').fadeOut(500);
        $('#notification').html('');
      }, 3000);
    });
  });

  // Image preview handler
  $('input[name=lede-image-url]').change(function(evt) {
      $('#lede-image-preview').html('<img src="'+recommendation.image+'" width="75" height="75">');
  });

  // Handler to send daily email
  $('#send-email').click(function(evt) {
    evt.preventDefault();
    $('#notification').html(
      '<p>Sending Email...</p>'+
      '<img src="/images/ajax-loader.gif">'
    );
    $('#notification').fadeIn(200);
    api.notifier.sendDaily(activeUser, function(r) {
      updateRecommendations(userid, function() {
        $('#notification').fadeOut(500);
        $('#notification').html('');
      });
    });
  });

});
