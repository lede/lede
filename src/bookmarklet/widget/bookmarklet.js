var yarn = require('./build/yarn');

var elem = yarn('bookmarklet.html', ['bookmarklet.css']);

exports.inject = function(target_element) {
  target_element.appendChild(elem);
};


