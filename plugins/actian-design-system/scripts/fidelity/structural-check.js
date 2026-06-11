// scripts/fidelity/structural-check.js
"use strict";
var cp = require("node:child_process");

var WIDTHS = [1440, 768, 360];

// In-page measurement script. Runs after layout, embeds JSON into #fidelity-metrics.
// Strategy: call run() synchronously first (so --dump-dom always gets a result),
// then also schedule an async update after fonts.ready + rAF for live-browser accuracy.
// Caveat: the sync run() fires before web fonts load, so 'clipped' may under-report on
// text-heavy leaves; the async fonts/rAF update corrects live runs. For --dump-dom the
// sync result is the one captured (overflow/absPos are layout-computed, font-independent).
function measureScript() {
  return [
    "(function(){function run(){",
    "var root=document.getElementById('fidelity-root')||document.body;",
    "var overflow=root.scrollWidth>root.clientWidth;",
    "var clipped=0,absPos=0;",
    "var all=root.querySelectorAll('*');",
    "for(var i=0;i<all.length;i++){var el=all[i];var cs=getComputedStyle(el);",
    "if(cs.position==='absolute')absPos++;",
    "if(el.scrollWidth>el.clientWidth+1||el.scrollHeight>el.clientHeight+1){",
    "if(el.children.length===0)clipped++;}}",
    "var out={overflow:overflow,clipped:clipped,absPos:absPos};",
    "var n=document.getElementById('fidelity-metrics');",
    "if(!n){n=document.createElement('div');n.id='fidelity-metrics';document.body.appendChild(n);}",
    "n.textContent=JSON.stringify(out);}",
    "run();",
    "if(document.fonts&&document.fonts.ready){document.fonts.ready.then(function(){requestAnimationFrame(run);});}",
    "})();",
  ].join("");
}

function parseMetrics(dumpedDom) {
  var m = /<div id=['"]fidelity-metrics['"]>([^<]*)<\/div>/.exec(
    String(dumpedDom),
  );
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch (e) {
    return null;
  }
}

function verdict(perWidth) {
  var failures = [];
  Object.keys(perWidth).forEach(function (w) {
    var mx = perWidth[w];
    if (mx.overflow) failures.push({ width: Number(w), kind: "overflow" });
    if (mx.clipped > 0) failures.push({ width: Number(w), kind: "clip" });
    if (mx.absPos > 0) failures.push({ width: Number(w), kind: "abs-pos" });
  });
  return {
    pass: failures.length === 0,
    failures: failures,
    perWidth: perWidth,
  };
}

// --- shell edge: render at one width with the measure script injected, dump DOM ---
function measureAtWidth(opts) {
  var chrome = opts.chrome,
    htmlPath = opts.htmlPath,
    width = opts.width;
  var args = [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    // advance virtual time 2s so deferred scripts settle before --dump-dom captures
    "--virtual-time-budget=2000",
    "--window-size=" + width + ",900",
    "--dump-dom",
    "file://" + htmlPath,
  ];
  var res = cp.spawnSync(chrome, args, {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  // Surface spawn failures (missing binary, crash) instead of returning a silent
  // null — the caller still gets null and treats it as a structural fail.
  if (res.error || res.status !== 0) {
    process.stderr.write(
      "[fidelity] Chrome --dump-dom failed (status " +
        res.status +
        (res.error ? ", " + res.error.message : "") +
        ")\n",
    );
  }
  return parseMetrics(res.stdout || "");
}

module.exports = {
  WIDTHS: WIDTHS,
  measureScript: measureScript,
  parseMetrics: parseMetrics,
  verdict: verdict,
  measureAtWidth: measureAtWidth,
};
