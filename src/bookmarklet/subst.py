#!/usr/bin/python

import sys

if len(sys.argv) != 5:
  sys.stderr.write("Need 4 arguments")
  exit(1)

filename = sys.argv[1]
variable = sys.argv[2]
subsitutitionType = sys.argv[3]
substitutionValue = sys.argv[4]

with open(filename, "r") as inputFile:
  data = inputFile.read()

if subsitutitionType == "--value":
  value = substitutionValue
elif subsitutitionType == "--file":
  with open(substitutionValue, "r") as valueFile:
    value = valueFile.read().rstrip()
else:
  sys.stderr.write("Need --value or --file")
  exit(1)
  
sys.stdout.write(data.replace("{{{" + variable + "}}}", value))
