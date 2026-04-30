"use strict";

// Thin REST wrapper around the Figma file API. Used by sync-from-figma.js
// (Sprint 1+) to pull components, styles, and frame trees nightly.
//
// Auth: process.env.FIGMA_PAT (Personal Access Token, Pro tier sufficient for
// every endpoint exposed here — Variables API is the one Enterprise-gated
// endpoint and is intentionally NOT wrapped here).
//
// Retries: 5xx up to 3 times with exponential backoff (1s, 2s, 4s).
// 429 retried once after a longer backoff. 4xx (other than 429) throw immediately.

var BASE = "https://api.figma.com";
var DEFAULT_BACKOFF_DELAYS_MS = [1000, 2000, 4000]; // 5xx retries
var DEFAULT_RATE_LIMIT_BACKOFF_MS = 5000;           // 429 retry delay
var MAX_5XX_RETRIES = 3;

// Mutable to allow tests to set [0,0,0] for fast runs without sleeping.
var BACKOFF_DELAYS_MS = DEFAULT_BACKOFF_DELAYS_MS.slice();
var RATE_LIMIT_BACKOFF_MS = DEFAULT_RATE_LIMIT_BACKOFF_MS;

function sleep(ms) {
  if (ms <= 0) return Promise.resolve();
  return new Promise(function (resolve) { setTimeout(resolve, ms); });
}

function authHeader() {
  var pat = process.env.FIGMA_PAT;
  if (!pat) {
    var err = new Error("FIGMA_PAT environment variable is not set. Generate a Figma Personal Access Token and add it to plugins/actian-design-system/.env");
    throw err;
  }
  return { "X-Figma-Token": pat };
}

function buildError(status, statusText, bodyText, url) {
  var msg = "Figma API request failed: " + status + " " + (statusText || "") + " (" + url + ")";
  if (bodyText) msg += " — " + bodyText.slice(0, 200);
  var err = new Error(msg);
  err.status = status;
  err.url = url;
  return err;
}

// Single network call with retry policy. Returns parsed JSON or throws.
function request(url) {
  var attempt = 0;

  function attemptOnce() {
    var headers;
    try { headers = authHeader(); } catch (e) { return Promise.reject(e); }

    return globalThis.fetch(url, { headers: headers }).then(function (res) {
      if (res.ok) {
        return res.json();
      }

      if (res.status === 429) {
        // Rate limited — retry once after backoff
        if (attempt === 0) {
          attempt = 1;
          return sleep(RATE_LIMIT_BACKOFF_MS).then(attemptOnce).then(null, function (err) {
            // If retry also failed, surface the error from the retry
            return Promise.reject(err);
          });
        }
        return res.text().then(function (body) {
          throw buildError(429, res.statusText, body, url);
        });
      }

      if (res.status >= 500 && res.status < 600) {
        // 5xx — retry up to MAX_5XX_RETRIES with exponential backoff
        if (attempt < MAX_5XX_RETRIES) {
          var delay = BACKOFF_DELAYS_MS[attempt] !== undefined
            ? BACKOFF_DELAYS_MS[attempt]
            : BACKOFF_DELAYS_MS[BACKOFF_DELAYS_MS.length - 1];
          attempt++;
          return sleep(delay).then(attemptOnce);
        }
        return res.text().then(function (body) {
          throw buildError(res.status, res.statusText, body, url);
        });
      }

      // 4xx (other than 429) — no retry
      return res.text().then(function (body) {
        throw buildError(res.status, res.statusText, body, url);
      });
    });
  }

  return attemptOnce();
}

// ---- Public surface ----

function getFile(fileKey, opts) {
  opts = opts || {};
  var depth = opts.depth === undefined ? 1 : opts.depth;
  var url = BASE + "/v1/files/" + encodeURIComponent(fileKey);
  // depth=0 = full tree (no param). depth>=1 = limit nesting.
  if (depth >= 1) url += "?depth=" + depth;
  return request(url);
}

function getNode(fileKey, nodeId) {
  if (!nodeId) return Promise.reject(new Error("getNode requires a nodeId"));
  var url = BASE + "/v1/files/" + encodeURIComponent(fileKey)
    + "/nodes?ids=" + encodeURIComponent(nodeId);
  return request(url);
}

function getStyles(fileKey) {
  return request(BASE + "/v1/files/" + encodeURIComponent(fileKey) + "/styles");
}

function getComponents(fileKey) {
  return request(BASE + "/v1/files/" + encodeURIComponent(fileKey) + "/components");
}

function getComponentSets(fileKey) {
  return request(BASE + "/v1/files/" + encodeURIComponent(fileKey) + "/component_sets");
}

// Test helper — lets tests override backoff so the retry suite runs fast.
function _setBackoffDelays(delays, rateLimitDelay) {
  BACKOFF_DELAYS_MS = delays.slice();
  if (rateLimitDelay !== undefined) RATE_LIMIT_BACKOFF_MS = rateLimitDelay;
  else RATE_LIMIT_BACKOFF_MS = 0;
}

function _resetBackoffDelays() {
  BACKOFF_DELAYS_MS = DEFAULT_BACKOFF_DELAYS_MS.slice();
  RATE_LIMIT_BACKOFF_MS = DEFAULT_RATE_LIMIT_BACKOFF_MS;
}

module.exports = {
  getFile: getFile,
  getNode: getNode,
  getStyles: getStyles,
  getComponents: getComponents,
  getComponentSets: getComponentSets,
  _setBackoffDelays: _setBackoffDelays,
  _resetBackoffDelays: _resetBackoffDelays,
};
