var db = require('../db');

exports.up = function(next){
  db.run("create or replace function explode_array(in_array anyarray) returns setof anyelement as $$ select ($1)[s] from generate_series(1,array_upper($1, 1)) as s; $$ language sql immutable;", next);
};

exports.down = function(next){
  next();
};
