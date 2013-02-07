var yarn = require('./build/yarn');

var elem = yarn('bookmarklet.html', ['bookmarklet.css']);

exports.inject = function inject(target_element) {
  if (typeof(response) == 'undefined' || !response) {
    setTimeout(function() { inject(target_element); }, 100);
  } else {
    if (response.message) {
      elem.querySelector('#message').textContent = response.message;
    }

    target_element.appendChild(elem);
    __LEDE_POPDOWN__ = elem;
  }
};

