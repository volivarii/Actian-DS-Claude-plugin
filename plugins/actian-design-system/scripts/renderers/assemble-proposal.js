"use strict";

/**
 * assemble-proposal.js: assembles a design proposal document, one offline HTML
 * file, from proposals/proposal-data.json.
 *
 * The reader is a PM or a designer approving a direction, so the document opens
 * with what was asked and leads with what ships: the answer, a summary of the
 * parts, one block per part with the chosen drawing and why, how the parts
 * connect, what to settle before building, what changes, the background, then,
 * folded, the options not chosen with their comparison and the research, then
 * the sources and the closing line. A part is
 * headed by what it builds (decisions[].part), never by the question behind it:
 * the question frames the comparison and stays in the data.
 *
 * Within a decision every option renders at the same width, the widest declared,
 * computed here rather than trusted from the data: research on prototype fidelity
 * found that unequal presentation corrupts a stakeholder's judgement in both
 * directions, so an author must not be able to draw their favourite at 720 and its
 * rival at 320. Nothing squeezes a drawing below that width.
 *
 * Grounding the author does not have to think about: the app header strip is
 * the flow renderer's own appHeader markup for the anchor's app (so the label
 * is the one the substrate records), fm-base.css is inlined from the vendored
 * renderer, and the file loads nothing from the network.
 *
 * No side effects at load. Exported: assembleProposal(data) -> html string.
 * Throws Error("proposal-data: ...") on schema errors, unknown app slugs,
 * unbalanced fragments, a pick naming no option and a reason naming no
 * criterion; validate-proposal.js reports the same things as findings before an
 * author gets here.
 */

var fs = require("fs");
var path = require("path");
var PATHS = require("../lib/paths");
var shared = require("./assemble-shared");
var renderer = require("../lib/renderer.js");
var validateSchema = require("../validation/validate-schema.js");
var flowRenderer = require("./html-renderers/flow-renderer.js");
var breadboard = require("./proposal-breadboard.js");

var esc = renderer.fmHtmlMap.esc;
var readFileChecked = shared.readFileChecked;
var TEMPLATE_PATH = path.join(shared.TEMPLATES_DIR, "proposal-document.html");
var SCHEMA_PATH = path.join(__dirname, "..", "..", "schemas", "proposal-data.schema.json");

// Tags a fragment may open; each must close. Void elements are not listed. details and summary
// are here because the options not chosen render inside a fold: a stray close in a drawing
// would end it early and spill the rest of the section onto the page.
var BALANCED_TAGS = ["div", "span", "p", "section", "button", "a", "ul", "ol", "li", "table", "thead", "tbody", "tr", "td", "th", "label", "h1", "h2", "h3", "h4", "details", "summary"];
var TONES = { good: "tone-good", mixed: "tone-mixed", bad: "tone-bad" };

function maskComment(s) {
  return String(s == null ? "" : s).replace(/-(?=-)/g, "-\u200b");
}

function stripComments(s) {
  return String(s == null ? "" : s).replace(/<!--[\s\S]*?-->/g, "");
}

function loadApps() {
  var ctx = JSON.parse(fs.readFileSync(PATHS.appContext, "utf8"));
  return ctx.apps || {};
}

function templateForApp(slug) {
  // TEMPLATE_CHROME keys: admin, studio, explorer. app-context slugs: administration, studio, explorer.
  return slug === "administration" ? "admin" : slug;
}

function unbalancedTag(html) {
  var s = stripComments(html);
  for (var i = 0; i < BALANCED_TAGS.length; i++) {
    var t = BALANCED_TAGS[i];
    var open = (s.match(new RegExp("<" + t + "(\\s|>)", "gi")) || []).length;
    var close = (s.match(new RegExp("</" + t + "\\s*>", "gi")) || []).length;
    if (open !== close) return t;
  }
  return null;
}

function appLabel(apps, slug) {
  return apps[slug] && apps[slug].label ? apps[slug].label : slug;
}

function section(title, inner, extraClass) {
  return '  <section class="doc__section' + (extraClass ? " " + extraClass : "") + '">' + (title ? "<h2>" + esc(title) + "</h2>" : "") + inner + "</section>\n";
}

// A drawing is drawn at the width it was composed at, never squeezed: laid out narrower, its
// content spills past its frame. A budget that capped width by option count (588, 384, 282) did
// exactly that on DIP-I-540 and again on DS-116. About 320 is a menu, 400 a form region, and a page
// region runs up to the 1200 the document is wide. Exported so the validator bounds a declared
// width by the numbers this draws with, not by a copy of them.
var DRAWING_WIDTH = { min: 240, max: 1200 };

// Up to this width the chosen drawing sits beside its case; wider, it takes the row below. At 720
// the case keeps 432px of the 1200, and anything wider squeezes it toward its 380px floor.
var BESIDE_CASE = 720;

// On paper a drawing gets the page's width, not the screen's. A4 at the browser's default margins
// leaves about 718px and the body keeps 40px each side, so 620 fits A4 and Letter with the ring.
// A wider drawing is zoomed down to it for print only, shrunk the way a screenshot is and never
// reflowed, so the prose around it keeps its size. Left to the browser, a page with a drawing
// wider than the paper shrank every line of it, and past about 1030px still cut the drawing.
var PRINT_WIDTH = 620;

// A section a reader opens on demand. The heading stays outside, in the section, because
// inside a summary it takes the summary's button role and drops out of a screen reader's list
// of headings. The summary says how much is folded, so closed is never mistaken for empty.
function fold(summary, inner) {
  return '<details class="doc__more"><summary>' + esc(summary) + "</summary>" + inner + "</details>";
}

function list(cls, items) {
  return '<ul class="' + cls + '">' + items.map(function (i) { return "<li>" + i + "</li>"; }).join("") + "</ul>";
}

function findById(arr, id) {
  var hit = null;
  (arr || []).forEach(function (x) { if (x.id === id) hit = x; });
  return hit;
}

// What a decision builds, as a reader names it. Authored as part. A file written before part
// existed has none, and the chosen option's surface ("the account menu") is the closest name
// it carries, so it is used with its article dropped rather than the question it replaced. The
// surface is authored text too: it is trimmed, and an empty one falls back to the id in words.
function partName(d) {
  if (d.part && String(d.part).trim()) return String(d.part).trim();
  var win = findById(d.options, d.pick.optionId);
  var s = String((win && win.anchor.surface) || "").trim().replace(/^the\s+/i, "");
  if (!s) s = String(d.id).replace(/-/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Every option in a decision renders at one width: the widest the author declared, held inside
// DRAWING_WIDTH. The part block and the other options read it from here, so the two can never
// disagree about how wide a drawing is.
function decisionWidth(d) {
  var widest = 0;
  d.options.forEach(function (o) { widest = Math.max(widest, Number(o.screen.width) || 360); });
  return Math.min(Math.max(widest, DRAWING_WIDTH.min), DRAWING_WIDTH.max);
}

// What was asked, before what we propose. DS-116 opened on its answer, under a title that was
// the answer again, so a reader who never saw the ticket met a solution before the problem.
// The ask is authored in plain words; the line under it is the ticket's own id and title,
// quoted, so a reader can tell the two apart. The ticket body is the input record and never
// prints.
var TICKET_SYSTEMS = { aha: "Aha", jira: "Jira", github: "GitHub" };

function askHtml(data) {
  var ask = String(data.context.ask || "").trim();
  var src = data.source || {};
  var id = String(src.id || "").trim();
  var title = String(src.title || "").trim();
  // The H1 already prints a title the author kept in the ticket's own words.
  if (title.toLowerCase() === String(data.meta.title || "").trim().toLowerCase()) title = "";
  var name = [TICKET_SYSTEMS[src.system] || "", id].filter(Boolean).join(" ");
  // A system alone names no ticket: "From Jira" tells a reader nothing.
  var ticket = id || title
    ? '<p class="ask__ticket">From ' + esc(name || "the ticket") + (title ? ": &ldquo;" + esc(title) + "&rdquo;" : "") + "</p>"
    : "";
  if (!ask && !ticket) return "";
  return section("The ask", (ask ? '<p class="ask">' + esc(ask) + "</p>" : "") + ticket);
}

// The answer is one sentence and nothing else: what we will build, labelled Proposal under the
// ask. The framing question used to sit above it, which opened a proposal with a question when
// its reader came for the answer; it stays in the data for the evaluation stage and the
// comparison.
//
// The pick lookup stays, because it is the only place that catches a pick naming an option
// that does not exist before any part renders.
function answerHtml(data) {
  data.decisions.forEach(function (d) {
    if (!findById(d.options, d.pick.optionId))
      throw new Error('proposal-data: decision "' + d.id + '" picks optionId "' + d.pick.optionId + '", which names no option in it');
  });
  return section("Proposal", '<p class="answer">' + esc(data.answer) + "</p>");
}

// What ships, one row per part: what it is and what it costs. Derived from decisions[], so
// it cannot say something the parts below do not. One part needs no summary of itself.
function shipsHtml(decisions) {
  if (decisions.length < 2) return "";
  var rows = decisions.map(function (d) {
    var win = findById(d.options, d.pick.optionId);
    return "<tr><th>" + esc(partName(d)) + "</th><td>" + esc(win.whatItIs) + "</td><td>" + esc(d.pick.cost) + "</td></tr>";
  }).join("");
  var table =
    '<table class="decisions-at-a-glance"><thead><tr><th>Part</th><th>What we will build</th><th>Cost</th></tr></thead>' +
    "<tbody>" + rows + "</tbody></table>";
  return section("What ships", table);
}

function terrainHtml(board) {
  if (!board || !board.places || !board.places.length) return "";
  var svg = breadboard.breadboardSvg(board);
  var legend =
    '<p class="bb__legend"><span><i class="bb__swatch"></i>Exists today</span>' +
    '<span><i class="bb__swatch bb__swatch--new"></i>New</span></p>';
  return section("How it connects", '<div class="bb">' + svg + "</div>" + legend);
}

function backgroundHtml(data) {
  function col(label, inner) {
    return '<div class="briefing__col"><h3>' + esc(label) + "</h3>" + inner + "</div>";
  }
  var inner =
    '<div class="briefing">' +
    col("Goals", list("doc__list", data.scope.goals.map(esc))) +
    col("Not doing", list("doc__list", data.scope.nonGoals.map(esc))) +
    col("How it works today", list("doc__list", data.context.product.map(esc))) +
    "</div>";
  return section("Background", inner);
}

// The four lanes, in the order a reader wants them: what the market does, what the canon
// says, what we already own, which is the one that constrains rather than informs, and last
// what the reader handed over themselves, which they already know and are checking we used.
var RESEARCH_LANES = [
  { id: "competitors", label: "Competitors" },
  { id: "designSystems", label: "Design systems" },
  { id: "ours", label: "Our product and design system" },
  { id: "yours", label: "Your references" },
];

function researchHtml(research) {
  if (!research.ran) {
    return section(
      "Research",
      '<p class="doc__muted">Not researched: ' + esc(research.skippedBecause || "") + "</p>",
    );
  }
  var shown = 0;
  var groups = RESEARCH_LANES.map(function (lane) {
    // A file written before the lanes existed carries findings with no lane. Refusing it
    // would strand every proposal already on disk, and what that research was is not a
    // mystery: it was the competitor sweep, because that was the only lane there was.
    var mine = research.findings.filter(function (f) {
      return (f.lane || "competitors") === lane.id;
    });
    if (!mine.length) return "";
    shown += mine.length;
    return (
      '<div class="research__lane"><h3>' + esc(lane.label) + "</h3>" +
      list("doc__list", mine.map(function (f) {
        return esc(f.claim) + ' <span class="doc__source">(' + esc(f.source) + ")</span>";
      })) +
      "</div>"
    );
  }).join("");
  var inner = '<div class="research">' + groups + "</div>";
  // Research argues for the design; it is not the design, so it folds like the options not
  // chosen. Nothing to count is nothing to fold.
  return section("Research", shown ? fold(shown === 1 ? "1 finding" : shown + " findings", inner) : inner);
}

// What a drawing is made of, printed where a reader can see it. "Built from" is quiet, and
// is the ordinary case. "Adds" is not quiet: a proposal that needs a component the system
// does not have is proposing work nobody has costed, and that belongs beside the drawing
// rather than in a build ticket three weeks later.
function compositionHtml(o) {
  var built = (o.uses || []).length ? '<p class="option__built">Built from ' + o.uses.map(esc).join(", ") + "</p>" : "";
  return built + addsHtml(o);
}

function addsHtml(o) {
  return (o.adds || []).map(function (a) {
    return '<p class="option__adds"><span class="option__adds-kind">Adds</span> ' + esc(a.component) + ". " + esc(a.why) + "</p>";
  }).join("");
}

function optionHtml(o, index, apps, width, lead, chosen) {
  if (!apps[o.anchor.app])
    throw new Error('proposal-data: unknown app "' + o.anchor.app + '" in option "' + o.id + '"; known: ' + Object.keys(apps).join(", "));
  var bad = unbalancedTag(o.screen.html);
  if (bad) throw new Error("proposal-data: unbalanced <" + bad + '> in option "' + o.id + '"');
  var type = flowRenderer.resolveChrome({ template: templateForApp(o.anchor.app) }).appHeaderType;
  var strip = flowRenderer.appHeader(type);
  var printWidth = Math.min(width, PRINT_WIDTH);
  var col = '<div class="proposal-screen__col" style="width:' + width + "px;--print-width:" + printWidth +
    "px;--print-zoom:" + Number((printWidth / width).toFixed(4)) + '">';
  var anchor = '<span class="proposal-screen__anchor">' + esc(appLabel(apps, o.anchor.app) + ", " + o.anchor.surface) + "</span>";
  var frame =
    '<div class="proposal-screen" data-name="' + esc(o.id) + '" style="width:' + width + 'px">' + strip +
    '<div class="proposal-screen__body">' + o.screen.html + "</div></div>";
  if (lead) {
    // The chosen option says what it is and where it breaks in the case beside it, so its own
    // card carries neither: the same two lines a hand's width apart is the document agreeing
    // with itself. Under it, one quiet run of its annotations and what it is built from.
    var notes = (o.screen.notes || []).length
      ? '<p class="option__notes">' + o.screen.notes.map(esc).join(" &middot; ") + "</p>"
      : "";
    return col + '<span class="proposal-screen__label proposal-screen__label--lead">' + anchor + "</span>" +
      frame + notes + compositionHtml(o) + "</div>\n";
  }
  // An option not chosen: its name, its drawing, and one line, the verdict and then where it
  // breaks. It once carried six things under the drawing (a caption, a run of notes, what it
  // is, where it breaks, what it is built from and a verdict tag that looked like a button),
  // mostly saying one thing twice; the comparison below carries the rest. Its surface is named
  // only when it is not the proposal's, and what it adds stays, because an addition is a cost.
  var sameSurface = chosen && chosen.anchor.app === o.anchor.app &&
    String(chosen.anchor.surface).trim().toLowerCase() === String(o.anchor.surface).trim().toLowerCase();
  // The verdict closes as a sentence, unless it already ends on a stop, an ellipsis or a stop
  // inside a quote; an empty one prints nothing rather than a lone bold period.
  var verdict = String(o.verdict).trim();
  if (verdict && !/[.!?\u2026]["'\u201d\u2019]?$/.test(verdict)) verdict += ".";
  return col + '<p class="option__name">' + esc(o.name) + "</p>" +
    (sameSurface ? "" : '<span class="proposal-screen__label">' + anchor + "</span>") +
    frame + '<p class="option__why">' + (verdict ? "<b>" + esc(verdict) + "</b> " : "") + esc(o.breaksWhen) + "</p>" +
    addsHtml(o) + "</div>\n";
}

// The document PROPOSES; the reader decides. Nothing a reader sees says "decided" or
// "picked": the chosen column is "Proposed". The data model still calls them decisions[]
// and pick, because that is what the author is choosing between and what the flow bridge
// addresses by id, and renaming those would break every authored file and both --decision
// and --option for no reader.
function comparisonHtml(cmp, options, pickedId) {
  var head =
    "<tr><th></th>" +
    options.map(function (o) {
      if (o.id !== pickedId) return "<th>" + esc(o.name) + "</th>";
      return '<th class="compare__pick">' + esc(o.name) + '<span class="compare__picked">Proposed</span></th>';
    }).join("") +
    "</tr>";
  var rows = cmp.criteria.map(function (c) {
    var cells = options.map(function (o) {
      var mark = o.id === pickedId ? " compare__pick" : "";
      var cell = (cmp.cells[o.id] || {})[c.id];
      var tone = cell ? TONES[cell.tone] || "tone-mixed" : "tone-mixed";
      return (
        '<td class="' + tone + mark + '"><span class="compare__mark"></span>' +
        '<span class="compare__text">' + esc(cell ? cell.text : "") + "</span></td>"
      );
    }).join("");
    return "<tr><th>" + esc(c.label) + '<span class="compare__source">' + esc(c.source) + "</span></th>" + cells + "</tr>";
  }).join("");
  return '<table class="compare"><thead>' + head + "</thead><tbody>" + rows + "</tbody></table>";
}

// The case for a part: what it is, why (each reason beside the criterion it argues from),
// where it breaks, and what it costs. Where it breaks is the most load-bearing line here,
// because it says where the thing we are proposing fails.
function pickHtml(d) {
  var win = findById(d.options, d.pick.optionId);
  var reasons = d.pick.reasons.map(function (r) {
    var crit = findById(d.comparison.criteria, r.criterionId);
    if (!crit)
      throw new Error('proposal-data: decision "' + d.id + '" has a reason naming criterionId "' + r.criterionId + '", which names no criterion in it');
    return '<li><span class="pick__crit">' + esc(crit.label) + "</span> " + esc(r.text) + "</li>";
  }).join("");
  return (
    '<div class="pick"><p class="pick__lead">' + esc(win.whatItIs) + "</p>" +
    '<h3 class="pick__label">Why</h3><ul class="pick__reasons">' + reasons + "</ul>" +
    '<p class="pick__cost"><b>Breaks when.</b> ' + esc(win.breaksWhen) + "</p>" +
    '<p class="pick__cost"><b>Cost.</b> ' + esc(d.pick.cost) + "</p></div>"
  );
}

// One block per part: its name, the case, and the chosen drawing beside it. Nothing else.
// The options not chosen and the comparison that chose between them follow the design, under
// Other options, because a reader approving a direction reads the direction first.
function partHtml(d, apps) {
  var win = findById(d.options, d.pick.optionId);
  var width = decisionWidth(d);
  return (
    '  <section class="decision" id="' + esc(d.id) + '"><h2>' + esc(partName(d)) + "</h2>" +
    '<div class="decision__lead' + (width > BESIDE_CASE ? " decision__lead--stacked" : "") + '">' +
    '<div class="decision__case">' + pickHtml(d) + "</div>" +
    optionHtml(win, d.options.indexOf(win), apps, width, true) + "</div></section>\n"
  );
}

// What each part was chosen over, and the comparison that chose it. Kept complete, which is
// what keeps this a proposal rather than a sales sheet. The options not chosen render at the
// proposal's own width, so none is flattered over its peers, and they wrap onto more rows rather
// than shrink: they are folded, so the length costs nothing until a reader opens them.

function otherOptionsHtml(decisions, apps) {
  var notChosen = 0;
  var groups = decisions.map(function (d) {
    var rest = d.options.filter(function (o) { return o.id !== d.pick.optionId; });
    if (!rest.length) return "";
    notChosen += rest.length;
    var win = findById(d.options, d.pick.optionId);
    var width = decisionWidth(d);
    return (
      '<div class="other" id="' + esc(d.id) + '-options">' +
      (decisions.length > 1 ? "<h3>" + esc(partName(d)) + "</h3>" : "") +
      '<div class="approaches">' +
      rest.map(function (o) { return optionHtml(o, d.options.indexOf(o), apps, width, false, win); }).join("") +
      '</div><div class="compare-block">' + comparisonHtml(d.comparison, d.options, d.pick.optionId) + "</div></div>"
    );
  }).join("");
  // Folded: a reader approving a direction reads the design, and these are for the reader who
  // asks what it was chosen over. On DS-116 they were 2,500px of an 8,000px page.
  // "compared with the proposal", never "not picked": nothing a reader sees says the choice is made.
  var summary = notChosen + (notChosen === 1 ? " option" : " options") + ", compared with the proposal";
  return groups ? section("Other options", fold(summary, groups)) : "";
}

// What has to be settled before anyone builds: the blockers first, each naming its part,
// because a blocker is a question that would change a pick; then the open questions and
// risks, which by definition do not.
function beforeWeBuildHtml(data) {
  var blockers = data.decisions.filter(function (d) { return d.blocker; }).map(function (d) {
    return '<p class="decision__blocker"><b>Blocker, ' + esc(partName(d)) + ".</b> " + esc(d.blocker) + "</p>";
  }).join("");
  var open = (data.openQuestions || []).map(function (q) {
    return '<span class="oq__kind">' + (q.kind === "rabbit hole" ? "Risk" : "Open question") + "</span>" + esc(q.text);
  });
  if (!blockers && !open.length) return "";
  return section("Before we build", blockers + (open.length ? list("doc__list oq", open) : ""));
}

function changeHtml(change) {
  function col(label, text) {
    return text ? '<div class="change__col"><h3>' + esc(label) + "</h3><p>" + esc(text) + "</p></div>" : "";
  }
  var inner = '<div class="change">' + col("For users", change.userSide) + col("For admins", change.adminSide) + "</div>";
  return section("What changes", inner);
}

// Where the assessment meets the substrate. Each source is one row of kind and text, and the
// kind is the prefix the schema already asks for, so the rows line up instead of repeating
// "app-context:" five times down the left. A source with no recognised prefix renders as its
// own text, unkinded, rather than being dropped: an unlabelled citation is still a citation.
//
// context.gap sits here too. It says what the product read could not reach, which is a note
// about the sources, and a PM reading the design above has no use for it before then.
function citationsHtml(context) {
  var sources = context.sources || [];
  if (!sources.length && !context.gap) return "";
  var rows = sources.map(function (src) {
    var cut = src.indexOf(": ");
    var kind = cut === -1 ? "" : src.slice(0, cut);
    var text = cut === -1 ? src : src.slice(cut + 2);
    return (
      '<div class="citations__row">' +
      '<span class="citations__kind">' + esc(kind) + "</span>" +
      '<span class="citations__text">' + esc(text) + "</span></div>"
    );
  }).join("");
  var gap = context.gap ? '<p class="doc__muted">' + esc(context.gap) + "</p>" : "";
  return section("Sources", '<div class="citations">' + rows + "</div>" + gap);
}

function latitudeHtml(text) {
  if (!text) return "";
  return section("", '<p class="doc__latitude">' + esc(text) + "</p>");
}

// Provenance is one line saying who and when. The follow-ups that used to sit here
// named the data file, the --from flag and a slash command: build instructions, in the
// last thing a PM reads, addressed to the one reader who is not reading. The skill
// offers them in chat, where the author already is.
function footerHtml(meta) {
  return '  <p class="doc__footer">' + esc(meta.skill + (meta.model ? ", " + meta.model : "") + ", " + meta.date + ".") + "</p>\n";
}

// The fragment an Artifact publish sends. The host supplies <!doctype>, <head> and
// <body>, so those have to go or the page renders one document inside another; the title
// stays, because the gallery reads it out of the first 8KB of what it is given.
//
// The three seams below are the template's, and a template edit is exactly what would
// break this quietly: a slice that stops matching returns the whole document, which
// publishes and looks right until the nesting bites. So each seam is counted, and a
// count that is not one throws. The tests doctor each seam in turn to prove it can.
var FRAGMENT_SEAMS = [
  { name: "title", re: /<title>/g },
  { name: "head-to-body", re: /\n<\/head>\n<body>\n/g },
  // Deliberately not anchored to the end. Anchored, a document carrying the closing tags
  // twice still counts one match, the guard passes, and the fragment keeps a stray
  // </body></html> in its middle. Unanchored, a second pair is what it is: a seam that
  // matched twice, which throws.
  { name: "closing", re: /\n<\/body>\n<\/html>/g },
];

function toFragment(html) {
  FRAGMENT_SEAMS.forEach(function (seam) {
    var n = (html.match(seam.re) || []).length;
    if (n !== 1) {
      throw new Error(
        "proposal fragment: the " + seam.name + " seam matched " + n + " times, expected 1. " +
          "templates/proposal-document.html changed shape; update FRAGMENT_SEAMS with it.",
      );
    }
  });
  return html
    .slice(html.indexOf("<title>"))
    .replace(FRAGMENT_SEAMS[1].re, "\n")
    .replace(FRAGMENT_SEAMS[2].re, "\n");
}

function jumpHtml(decisions) {
  if (decisions.length < 2) return "";
  return (
    '  <nav class="doc__jump" aria-label="The parts of this proposal">' +
    decisions
      .map(function (d, i) {
        var name = partName(d);
        return (
          '<a class="doc__jump-item" href="#' + esc(d.id) + '" title="' + esc(name) + '">' +
          '<span class="doc__jump-num">' + (i + 1) + "</span>" +
          '<span class="doc__jump-text">' + esc(name) + "</span></a>"
        );
      })
      .join("") +
    "</nav>\n"
  );
}

function assembleProposal(data, options) {
  var errors = validateSchema(data, JSON.parse(fs.readFileSync(SCHEMA_PATH, "utf8"))).filter(function (e) {
    return e.indexOf("(warning)") === -1;
  });
  if (errors.length) throw new Error("proposal-data: schema: " + errors.join("; "));
  var meta = data.meta;
  var apps = loadApps();
  var sections =
    askHtml(data) +
    answerHtml(data) +
    shipsHtml(data.decisions) +
    jumpHtml(data.decisions) +
    data.decisions.map(function (d) { return partHtml(d, apps); }).join("") +
    terrainHtml(data.breadboard) +
    beforeWeBuildHtml(data) +
    changeHtml(data.change) +
    backgroundHtml(data) +
    otherOptionsHtml(data.decisions, apps) +
    researchHtml(data.research) +
    citationsHtml(data.context) +
    latitudeHtml(data.latitude) +
    footerHtml(meta);
  var context = [meta.ticket || "", meta.apps.map(function (a) { return appLabel(apps, a); }).join(", "), meta.date]
    .filter(Boolean).join("  ·  ");
  var metaComment =
    "<!--\n  Actian Design System, design-proposal (document deliverable)\n" +
    "  skill:   " + maskComment(meta.skill) + "\n" +
    "  ticket:  " + maskComment(meta.ticket || "") + "\n" +
    "  prompt:  " + maskComment(meta.prompt || "") + "\n" +
    "  date:    " + maskComment(meta.date) + "\n" +
    "  model:   " + maskComment(meta.model || "") + "\n-->";
  var fmCss = readFileChecked(renderer.cssPaths.fmBase);
  var template = readFileChecked(TEMPLATE_PATH);
  var html = template
    .replace("{{META_COMMENT}}", function () { return metaComment; })
    .replace(/\{\{TITLE\}\}/g, function () { return esc(meta.title); })
    .replace("{{CONTEXT}}", function () { return esc(context); })
    .replace("{{FM_CSS}}", function () { return fmCss; })
    .replace("<!-- {{SECTIONS}} -->", function () { return sections; });
  return options && options.fragment ? toFragment(html) : html;
}

module.exports = {
  assembleProposal: assembleProposal,
  toFragment: toFragment,
  extractUnbalancedTag: unbalancedTag,
  DRAWING_WIDTH: DRAWING_WIDTH,
  PRINT_WIDTH: PRINT_WIDTH,
};
