"use strict";

var fs = require("fs");

function parseFigmaUrl(url) {
  if (typeof url !== "string") return null;
  var m = url.match(/figma\.com\/(?:design|file)\/([^/?#]+)/);
  if (!m) return null;
  var fileKey = m[1];
  var nodeId = null;
  var nm = url.match(/[?&]node-id=([^&]+)/);
  if (nm) {
    nodeId = decodeURIComponent(nm[1]).replace(/-/g, ":");
  }
  return { fileKey: fileKey, nodeId: nodeId };
}

function resolveByUrl(url, manifestPath) {
  var parsed = parseFigmaUrl(url);
  if (!parsed) return { kind: "miss", reason: "unparseable URL" };

  var manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch (e) {
    return { kind: "miss", reason: "manifest unreadable" };
  }

  if (manifest.fileKey !== parsed.fileKey) {
    return { kind: "miss", reason: "file mismatch" };
  }

  if (parsed.nodeId === manifest.pageNodeId) {
    return { kind: "full", screenId: null };
  }

  var nodes = manifest.pushedNodes || [];
  for (var i = 0; i < nodes.length; i++) {
    if (nodes[i].id === parsed.nodeId) {
      if (!nodes[i].screenId) {
        return {
          kind: "miss",
          reason: "manifest pre-dates screenId",
        };
      }
      return {
        kind: "single-unit",
        screenId: nodes[i].screenId,
        figmaNodeId: nodes[i].id,
      };
    }
  }

  return { kind: "miss", reason: "node not in pushedNodes" };
}

module.exports = {
  parseFigmaUrl: parseFigmaUrl,
  resolveByUrl: resolveByUrl,
};
