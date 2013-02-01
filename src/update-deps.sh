#!/bin/bash

find . -type d -path "*node_modules*" -prune -o -name package.json -printf "%h\n" | while read -r dir
do
  pushd $dir
  npm update
  popd
done
