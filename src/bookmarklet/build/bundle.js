(function(){var require = function (file, cwd) {
    var resolved = require.resolve(file, cwd || '/');
    var mod = require.modules[resolved];
    if (!mod) throw new Error(
        'Failed to resolve module ' + file + ', tried ' + resolved
    );
    var cached = require.cache[resolved];
    var res = cached? cached.exports : mod();
    return res;
};

require.paths = [];
require.modules = {};
require.cache = {};
require.extensions = [".js",".coffee",".json"];

require._core = {
    'assert': true,
    'events': true,
    'fs': true,
    'path': true,
    'vm': true
};

require.resolve = (function () {
    return function (x, cwd) {
        if (!cwd) cwd = '/';
        
        if (require._core[x]) return x;
        var path = require.modules.path();
        cwd = path.resolve('/', cwd);
        var y = cwd || '/';
        
        if (x.match(/^(?:\.\.?\/|\/)/)) {
            var m = loadAsFileSync(path.resolve(y, x))
                || loadAsDirectorySync(path.resolve(y, x));
            if (m) return m;
        }
        
        var n = loadNodeModulesSync(x, y);
        if (n) return n;
        
        throw new Error("Cannot find module '" + x + "'");
        
        function loadAsFileSync (x) {
            x = path.normalize(x);
            if (require.modules[x]) {
                return x;
            }
            
            for (var i = 0; i < require.extensions.length; i++) {
                var ext = require.extensions[i];
                if (require.modules[x + ext]) return x + ext;
            }
        }
        
        function loadAsDirectorySync (x) {
            x = x.replace(/\/+$/, '');
            var pkgfile = path.normalize(x + '/package.json');
            if (require.modules[pkgfile]) {
                var pkg = require.modules[pkgfile]();
                var b = pkg.browserify;
                if (typeof b === 'object' && b.main) {
                    var m = loadAsFileSync(path.resolve(x, b.main));
                    if (m) return m;
                }
                else if (typeof b === 'string') {
                    var m = loadAsFileSync(path.resolve(x, b));
                    if (m) return m;
                }
                else if (pkg.main) {
                    var m = loadAsFileSync(path.resolve(x, pkg.main));
                    if (m) return m;
                }
            }
            
            return loadAsFileSync(x + '/index');
        }
        
        function loadNodeModulesSync (x, start) {
            var dirs = nodeModulesPathsSync(start);
            for (var i = 0; i < dirs.length; i++) {
                var dir = dirs[i];
                var m = loadAsFileSync(dir + '/' + x);
                if (m) return m;
                var n = loadAsDirectorySync(dir + '/' + x);
                if (n) return n;
            }
            
            var m = loadAsFileSync(x);
            if (m) return m;
        }
        
        function nodeModulesPathsSync (start) {
            var parts;
            if (start === '/') parts = [ '' ];
            else parts = path.normalize(start).split('/');
            
            var dirs = [];
            for (var i = parts.length - 1; i >= 0; i--) {
                if (parts[i] === 'node_modules') continue;
                var dir = parts.slice(0, i + 1).join('/') + '/node_modules';
                dirs.push(dir);
            }
            
            return dirs;
        }
    };
})();

require.alias = function (from, to) {
    var path = require.modules.path();
    var res = null;
    try {
        res = require.resolve(from + '/package.json', '/');
    }
    catch (err) {
        res = require.resolve(from, '/');
    }
    var basedir = path.dirname(res);
    
    var keys = (Object.keys || function (obj) {
        var res = [];
        for (var key in obj) res.push(key);
        return res;
    })(require.modules);
    
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (key.slice(0, basedir.length + 1) === basedir + '/') {
            var f = key.slice(basedir.length);
            require.modules[to + f] = require.modules[basedir + f];
        }
        else if (key === basedir) {
            require.modules[to] = require.modules[basedir];
        }
    }
};

(function () {
    var process = {};
    
    require.define = function (filename, fn) {
        if (require.modules.__browserify_process) {
            process = require.modules.__browserify_process();
        }
        
        var dirname = require._core[filename]
            ? ''
            : require.modules.path().dirname(filename)
        ;
        
        var require_ = function (file) {
            var requiredModule = require(file, dirname);
            var cached = require.cache[require.resolve(file, dirname)];

            if (cached && cached.parent === null) {
                cached.parent = module_;
            }

            return requiredModule;
        };
        require_.resolve = function (name) {
            return require.resolve(name, dirname);
        };
        require_.modules = require.modules;
        require_.define = require.define;
        require_.cache = require.cache;
        var module_ = {
            id : filename,
            filename: filename,
            exports : {},
            loaded : false,
            parent: null
        };
        
        require.modules[filename] = function () {
            require.cache[filename] = module_;
            fn.call(
                module_.exports,
                require_,
                module_,
                module_.exports,
                dirname,
                filename,
                process
            );
            module_.loaded = true;
            return module_.exports;
        };
    };
})();


require.define("path",function(require,module,exports,__dirname,__filename,process){function filter (xs, fn) {
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (fn(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length; i >= 0; i--) {
    var last = parts[i];
    if (last == '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Regex to split a filename into [*, dir, basename, ext]
// posix version
var splitPathRe = /^(.+\/(?!$)|\/)?((?:.+?)?(\.[^.]*)?)$/;

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
var resolvedPath = '',
    resolvedAbsolute = false;

for (var i = arguments.length; i >= -1 && !resolvedAbsolute; i--) {
  var path = (i >= 0)
      ? arguments[i]
      : process.cwd();

  // Skip empty and invalid entries
  if (typeof path !== 'string' || !path) {
    continue;
  }

  resolvedPath = path + '/' + resolvedPath;
  resolvedAbsolute = path.charAt(0) === '/';
}

// At this point the path should be resolved to a full absolute path, but
// handle relative paths to be safe (might happen when process.cwd() fails)

// Normalize the path
resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
var isAbsolute = path.charAt(0) === '/',
    trailingSlash = path.slice(-1) === '/';

// Normalize the path
path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }
  
  return (isAbsolute ? '/' : '') + path;
};


// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    return p && typeof p === 'string';
  }).join('/'));
};


exports.dirname = function(path) {
  var dir = splitPathRe.exec(path)[1] || '';
  var isWindows = false;
  if (!dir) {
    // No dirname
    return '.';
  } else if (dir.length === 1 ||
      (isWindows && dir.length <= 3 && dir.charAt(1) === ':')) {
    // It is just a slash or a drive letter with a slash
    return dir;
  } else {
    // It is a full dirname, strip trailing slash
    return dir.substring(0, dir.length - 1);
  }
};


exports.basename = function(path, ext) {
  var f = splitPathRe.exec(path)[2] || '';
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPathRe.exec(path)[3] || '';
};

});

require.define("__browserify_process",function(require,module,exports,__dirname,__filename,process){var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
        && window.setImmediate;
    var canPost = typeof window !== 'undefined'
        && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return window.setImmediate;
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            if (ev.source === window && ev.data === 'browserify-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('browserify-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    if (name === 'evals') return (require)('vm')
    else throw new Error('No such module. (Possibly not yet loaded)')
};

(function () {
    var cwd = '/';
    var path;
    process.cwd = function () { return cwd };
    process.chdir = function (dir) {
        if (!path) path = require('path');
        cwd = path.resolve(dir, cwd);
    };
})();

});

require.define("/node_modules/domready/package.json",function(require,module,exports,__dirname,__filename,process){module.exports = {"main":"./ready.js"}
});

require.define("/node_modules/domready/ready.js",function(require,module,exports,__dirname,__filename,process){/*!
  * domready (c) Dustin Diaz 2012 - License MIT
  */
!function (name, definition) {
  if (typeof module != 'undefined') module.exports = definition()
  else if (typeof define == 'function' && typeof define.amd == 'object') define(definition)
  else this[name] = definition()
}('domready', function (ready) {

  var fns = [], fn, f = false
    , doc = document
    , testEl = doc.documentElement
    , hack = testEl.doScroll
    , domContentLoaded = 'DOMContentLoaded'
    , addEventListener = 'addEventListener'
    , onreadystatechange = 'onreadystatechange'
    , readyState = 'readyState'
    , loaded = /^loade|c/.test(doc[readyState])

  function flush(f) {
    loaded = 1
    while (f = fns.shift()) f()
  }

  doc[addEventListener] && doc[addEventListener](domContentLoaded, fn = function () {
    doc.removeEventListener(domContentLoaded, fn, f)
    flush()
  }, f)


  hack && doc.attachEvent(onreadystatechange, fn = function () {
    if (/^c/.test(doc[readyState])) {
      doc.detachEvent(onreadystatechange, fn)
      flush()
    }
  })

  return (ready = hack ?
    function (fn) {
      self != top ?
        loaded ? fn() : fns.push(fn) :
        function () {
          try {
            testEl.doScroll('left')
          } catch (e) {
            return setTimeout(function() { ready(fn) }, 50)
          }
          fn()
        }()
    } :
    function (fn) {
      loaded ? fn() : fns.push(fn)
    })
})
});

require.define("/widget/bookmarklet.js",function(require,module,exports,__dirname,__filename,process){var yarn = require('./build/yarn');

var elem = yarn('bookmarklet.html', ['bookmarklet.css']);

exports.inject = function(target_element) {
  target_element.appendChild(elem);
};



});

require.define("/widget/build/yarn.js",function(require,module,exports,__dirname,__filename,process){module.exports = require("yarnify")("_fa9c6d97-",{"/bookmarklet.html":"<div class='pop-down'>\n  <h1>You now lede this story</h1>\n</div>\n","/bookmarklet.css":["f99e2b21","._fa9c6d97-f99e2b21 div._fa9c6d97._fa9c6d97-pop-down {\n  display: none;\n  border-bottom: 1px solid #999;\n  background: #f5f5f5;\n  position: absolute;\n  top: 0px;\n  left: 0px;\n  width: 100%;\n  color: #333;\n}\n\n  ._fa9c6d97-f99e2b21 div._fa9c6d97._fa9c6d97-pop-down h1._fa9c6d97 {\n    margin:10px;\n  }\n\n"]});

});

require.define("/node_modules/yarnify/package.json",function(require,module,exports,__dirname,__filename,process){module.exports = {"main":"index.js","browserify":"browser.js"}
});

require.define("/node_modules/yarnify/browser.js",function(require,module,exports,__dirname,__filename,process){var path = require('path');
var parse = require('./browser/parse');
var withPrefix = require('./browser/with_prefix');

var objectKeys = Object.keys || function (obj) {
    var keys = [];
    for (var key in obj) keys.push(key);
    return keys;
};

var isArray = Array.isArray || function (xs) {
    return Object.prototype.toString.call(xs) === '[object Array]';
};

module.exports = function (prefix, files) {
    var elems = {};
    var cssElement = document.createElement('style');
    
    (function () {
        var sources = [];
        
        var keys = objectKeys(files);
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            if (/\.css$/i.test(key)) {
                sources.push(files[key][1]); 
            }
            else {
                elems[key] = parse(prefix, files[key]);
            }
        }
        
        var cssText = document.createTextNode(sources.join('\n'));
        cssElement.appendChild(cssText);
    })();
    
    var insertedCss = false;
    var y = function (file_, cssFiles) {
        var file = path.resolve('/', file_);
        if (!elems[file]) return undefined;
        var elem = withPrefix(prefix, elems[file].cloneNode(true));
        
        if (!cssFiles) cssFiles = [];
        if (!isArray(cssFiles)) cssFiles = [ cssFiles ];
        for (var i = 0; i < cssFiles.length; i++) {
            var cssFile = path.resolve('/', cssFiles[i])
            if (files[cssFile]) {
                var cssPrefix = files[cssFile][0];
                elem.addClass(cssPrefix);
            }
        }
        
        if (!insertedCss) {
            document.head.appendChild(cssElement);
            insertedCss = true;
        }
        return elem;
    };
    
    y.prefix = prefix;
    
    y.parse = function (src) {
        return parse(prefix, src);
    };
    
    y.files = objectKeys(files);
    
    return y;
};

});

require.define("/node_modules/yarnify/browser/parse.js",function(require,module,exports,__dirname,__filename,process){module.exports = function (prefix, src) {
    var elem = document.createElement('div');
    var className = prefix.slice(0, -1);
    elem.setAttribute('class', prefix + '_container');
    elem.innerHTML = src;
    
    var nodes = elem.querySelectorAll('*');
    
    for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        var c = node.getAttribute('class');
        if (c) {
            node.setAttribute('class', c.split(/\s+/)
                .map(function (x) { return  prefix + x })
                .concat(className)
                .join(' ')
            );
        }
        else {
            node.setAttribute('class', className);
        }
        
        var id = node.getAttribute('id');
        if (id) node.setAttribute('id', prefix + id);
    }
    
    return elem;
};

});

require.define("/node_modules/yarnify/browser/with_prefix.js",function(require,module,exports,__dirname,__filename,process){module.exports = function withPrefix (prefix, elem) {
    function wrap (e) {
        if (!e) return e
        if (e && e.length) {
            for (var i = 0; i < e.length; i++) {
                e[i] = withPrefix(prefix, e[i]);
            }
        }
        if (e._prefix === prefix) return e;
        
        return withPrefix(prefix, e);
    }
    
    elem._prefix = prefix;
    
    var querySelector = elem.constructor.prototype.querySelector;
    elem.querySelector = function (sel) {
        var s = sel.replace(/([.#])([^.\s])/g, function (_, op, c) {
            return op + prefix + c;
        });
        return wrap(querySelector.call(this, s));
    };
    
    var querySelectorAll = elem.constructor.prototype.querySelectorAll;
    elem.querySelectorAll = function (sel) {
        var s = sel.replace(/([.#])([^.\s])/g, function (_, op, c) {
            return op + prefix + c;
        });
        return wrap(querySelectorAll.call(this, s));
    };
    
    elem.addClass = function (c) {
        var ps = elem.className.split(/\s+/);
        if (ps.indexOf(prefix + c) < 0) {
            ps.push(prefix + c);
            elem.className = ps.join(' ');
        }
    };
    
    elem.removeClass = function (c) {
        var ps = elem.className.split(/\s+/);
        var ix = ps.indexOf(prefix + c);
        if (ix >= 0) {
            ps.splice(ix, 1);
            elem.className = ps.join(' ');
        }
    };
    
    elem.hasClass = function (c) {
        var ps = elem.className.split(/\s+/);
        var ix = ps.indexOf(prefix + c) >= 0;
        return ix >= 0;
    };
    
    return elem;
};

});

require.define("/entry.js",function(require,module,exports,__dirname,__filename,process){var domready = require('domready');
var widget = require('./widget/bookmarklet');

domready(function() {
  widget.inject(document.body);
});

});
require("/entry.js");
})();