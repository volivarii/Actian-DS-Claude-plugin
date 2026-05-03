"use strict";

var fs = require("fs");
var path = require("path");

var SNAPSHOT_FILENAME = "flow-data.snapshot.json";

function read(manifestDir) {
  var p = path.join(manifestDir, SNAPSHOT_FILENAME);
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (e) {
    return null;
  }
}

function write(manifestDir, data) {
  var p = path.join(manifestDir, SNAPSHOT_FILENAME);
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + "\n");
}

module.exports = {
  read: read,
  write: write,
  SNAPSHOT_FILENAME: SNAPSHOT_FILENAME,
};
