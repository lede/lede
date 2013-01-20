var activeUser = {};
var adminUser = {};

// grab the list of users from the backend
function initPage() {
  $('#admin-dashboard').hide();
  $('#add-lede').hide();
  $('#last-email-sent').hide();
  updateUserList();
}

//TODO: consider a more efficient way to collect the number of unsent ledes
function updateUserList(searchstr, callback) {
  var filter = {};
  if(searchstr) {
    filter = {'email.like': '%'+searchstr+'%'}; 
  }
  api.user.list(filter, function(users) {
    $('.user-list ul').html('');
    _.each(users, function(user) {
      api.recommendation.list({user_id: user.id, sent: false}, function (recommendations) {
        var selectedTag = (user.id === activeUser.id) ? 'class="selected"' : '';
        $('.user-list ul').append(
          '<li '+selectedTag+'>'+
            '<a id="user-'+user.id+'" href="#user/'+user.id+'">'+
              user.email+ '(' +recommendations.length + ')'+
            '</a>'+
          '</li>'
        );
      });
    });
  });
}

function updateLastNotification(userid, callback) {
  $('#last-email-sent-tag').html('');
  $('#lede-image-preview').html('');
  api.notification.list({user_id: userid, order: '-id', limit: 1}, function(notifications) {
    if(notifications.length) {
      var updateTime = _.pluck(notifications, 'created_at').pop();
      var formattedTime = moment(updateTime, "YYYY-MM-DDTHH:mm:ss Z").fromNow();
      $('#last-email-sent-tag').html(formattedTime);
    } else {
      $('#last-email-sent-tag').html('Send them an email');
    }
    callback();
  });
}

function updateRecentLedes(userid, callback) {
  $('.recent-notifications ul').html('');
  api.recommendation.list({user_id: userid, sent: true, order: '-id', limit: 9}, function(recommendations) {
    var li = recommendations.length ? '' : '<li>Send them some ledes!</li>';
    $('.recent-notifications ul').html(li);

    _.each(recommendations, function(recommendation) {
      $('.recent-notifications ul').append(
        '<li>'+
          '<a href="' + recommendation.uri + '" target="_blank">'+
            recommendation.title+
          '</a>'+
        '</li>'
      );
    });
  });
}

// grab the list of ledes from the backend
function updateRecommendations(userid, callback) {
  $('.queued-ledes ul').html('');
  api.recommendation.list({user_id: userid, sent: false, order: '-id'}, function(recommendations) {
    var li = recommendations.length ? '' : '<li>Queue up some ledes!</li>'; 
    $('.queued-ledes ul').html(li);

    _.each(recommendations, function(recommendation) {
      $('.queued-ledes ul').append(
        '<li>'+
          '<a href="' + recommendation.uri + '" target="_blank">'+
            recommendation.title+
          '</a>'+
        '</li>'
      );
    });
    callback();
  });
}

// grab the list of bookmarklet hits from the backend
function updateLedes(userid, callback) {
  $('.recent-bookmarklets ul').html('');
  api.lede.list({user_id: userid, limit: 10}, function(ledes) {
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
    callback();
  });
}

// render up the user details 
function renderUserDetails(userid) {
  $('#user-list li').removeClass('selected');
  $('#user-'+userid).parent().addClass('selected'); 

  var callbackCount = 3;
  $('#admin-dashboard').fadeOut(300);
  $('#add-lede').fadeOut(300);
  $('#last-email-sent').fadeOut(300);
  $('input[name=lede-url]').val('');
  $('input[name=lede-title]').val('');
  $('input[name=lede-author]').val('');
  $('textarea[name=lede-description]').val('');
  $('input[name=lede-image-url]').val('');
  $('#last-email-sent-tag').html('');
  $('#lede-image-preview').html('');

  updateLedes(userid, function(){
    callbackCount--;
    if(callbackCount === 0) {
      $('#admin-dashboard').fadeIn(200);
      $('#add-lede').fadeIn(300);
      $('#last-email-sent').fadeIn(300);
    }
  });

  updateRecentLedes(userid, function() {
    callbackCount--;
    if(callbackCount === 0) {
      $('admin-dashboard').fadeIn(200);
      $('#add-lede').fadeIn(300);
      $('#last-email-sent').fadeIn(300);
    }
  });

  updateRecommendations(userid, function(){
    callbackCount--;
    if(callbackCount === 0) {
      $('#admin-dashboard').fadeIn(200);
      $('#add-lede').fadeIn(300);
      $('#last-email-sent').fadeIn(300);
    }
  });

  updateLastNotification(userid, function(){
    callbackCount--;
    if(callbackCount === 0) {
      $('#admin-dashboard').fadeIn(200);
      $('#add-lede').fadeIn(300);
      $('#last-email-sent').fadeIn(300);
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

  //Set up Handlebars Templates
  var ledePreview = $('#lede-preview').html();
  var ledePreviewTemplate = Handlebars.compile(ledePreview);

  api.user.check(function(user) {
    adminUser = user.result;
  }, 
  function() {
    window.location='/login.html';
  });

  initPage();

  // Handler to search for users
  $('input[name=user-search]').keyup(function(evt) {

    if($('input[name=user-search]').val().length >= 3) {
      updateUserList($('input[name=user-search]').val().trim());
    }
    if($('input[name=user-search]').val() === '') {
      updateUserList();
    }
  });

  // Hander to reset ledes
  $('#reset-lede').click(function(evt) {
    $('#lede-image-preview').html('');
  });

  // Handler to preview ledes
  $('#preview-lede').click(function(evt) {
    evt.preventDefault();
    var recommendation = { 
      uri: $('input[name=lede-url]').val().trim(),
      title: $('input[name=lede-title]').val().trim(),
      author: $('input[name=lede-author]').val().trim(),
      description: $('textarea[name=lede-description]').val().trim(),
      image_url: $('input[name=lede-image-url]').val().trim()
    };

    $('#preview').html(ledePreviewTemplate(recommendation));
    $('#preview').fadeIn(200);
    $('#close-preview').click(function(evt) {
      evt.preventDefault();
      $('#preview').fadeOut(200);
      $('#preview').html('');
    });
  });

  // Handler to add ledes
  $('#add-lede-form').submit(function(evt) {
    evt.preventDefault();

    var recommendation = { 
      user_id: userid,
      created_by_user_id: adminUser.id,
      uri: $('input[name=lede-url]').val().trim(),
      title: $('input[name=lede-title]').val().trim(),
      author: $('input[name=lede-author]').val().trim(),
      description: $('textarea[name=lede-description]').val().trim(),
      image_url: $('input[name=lede-image-url]').val().trim(),
      sent: false
    };

    //TODO: make a call here to get the image resized and pointed to our local version.
    api.extractor.createThumbnail({url: recommendation.image_url}, function(image) {
      recommendation.image_url = image.url;

      api.recommendation.create(recommendation, function() {
        updateRecommendations(userid, function() {
          $('input[name=lede-url]').val('');
          $('input[name=lede-title]').val('');
          $('input[name=lede-author]').val('');
          $('textarea[name=lede-description]').val('');
          $('input[name=lede-image-url]').val('');
          $('#last-email-sent-tag').html('');
          $('#lede-image-preview').html('');

          updateUserList($('input[name=user-search]').val());
        });
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
      $('input[name=lede-url]').val($('input[name=lede-url]').val().trim());
      $('input[name=lede-title]').val(recommendation.title.trim());
      $('textarea[name=lede-description]').val(recommendation.description.trim());
      $('input[name=lede-image-url]').val(recommendation.image.trim());
      $('#lede-image-preview').html('<img src="'+recommendation.image.trim()+'" width="75" height="75">');
      $('#notification').fadeOut(500);
      $('#notification').html('');
    },
    function(err) {
      $('#notification').addClass('error');
      $('#notification').html('Extracting Lede Information Has Failed.<br />Check your URL and try again.');
      window.setTimeout(function() {
        $('#notification').fadeOut(500);
        $('#notification').removeClass('error');
        $('#notification').html('');
      }, 3000);
    });
  });

  // Image preview handler
  $('input[name=lede-image-url]').change(function(evt) {
      $('#lede-image-preview').html('<img src="'+$('input[name=lede-image-url]').val()+'" width="75" height="75">');
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
      updateRecentLedes(userid, function() {
        $('#notification').fadeOut(500);
        $('#notification').html('');
      });

    },
    function(err) {
      $('#notification').addClass('error');
      $('#notification').html('Sending the daily email has failed.');
      window.setTimeout(function() {
        $('#notification').fadeOut(500);
        $('#notification').removeClass('error');
        $('#notification').html('');
      }, 3000);
    });
  });

});
