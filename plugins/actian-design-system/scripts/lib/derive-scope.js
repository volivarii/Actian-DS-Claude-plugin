"use strict";

function deriveScope(beforeData, afterData) {
  var beforeScreens = (beforeData && beforeData.screens) || [];
  var afterScreens = (afterData && afterData.screens) || [];

  var beforeById = {};
  for (var i = 0; i < beforeScreens.length; i++) {
    if (beforeScreens[i] && beforeScreens[i].id) {
      beforeById[beforeScreens[i].id] = beforeScreens[i];
    }
  }

  var changed = [];
  var afterIds = {};
  for (var j = 0; j < afterScreens.length; j++) {
    var s = afterScreens[j];
    if (!s || !s.id) continue;
    afterIds[s.id] = true;
    var prev = beforeById[s.id];
    if (!prev) {
      changed.push(s.id);
      continue;
    }
    if (JSON.stringify(prev) !== JSON.stringify(s)) {
      changed.push(s.id);
    }
  }

  // Detect deletions
  for (var k = 0; k < beforeScreens.length; k++) {
    var bid = beforeScreens[k] && beforeScreens[k].id;
    if (!bid) continue;
    if (!afterIds[bid] && changed.indexOf(bid) === -1) {
      changed.push(bid);
    }
  }

  if (changed.length === 0) return null;

  // "full" means every screen in BOTH sides is changed
  var beforeIdsList = Object.keys(beforeById);
  var afterIdsList = Object.keys(afterIds);
  if (
    changed.length === afterIdsList.length &&
    changed.length === beforeIdsList.length &&
    afterIdsList.length > 0
  ) {
    return "full";
  }

  if (changed.length === 1) return "single-unit:" + changed[0];
  return "multi-unit:[" + changed.join(",") + "]";
}

module.exports = { deriveScope: deriveScope };
