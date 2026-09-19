"use strict";

// The part of a direct prototype no author writes: the strip above the product
// UI, the tiny runtime behind it, and the docking of layers. Strings only.

var CSS = [
  "html,body{margin:0;height:100%}",
  // padding and background are reset, not inherited: the frame's stylesheet
  // list ends with fm-base.css, whose body rule (padding 40px, grey canvas)
  // frames a screen as a card on a preview page. A prototype IS the app, so it
  // fills the window. Same move look.js makes for its standalone render page.
  "body{display:flex;flex-direction:column;padding:0;background:var(--zen-color-bg-default,#fff);font-family:var(--zen-font-family-text,Roboto,sans-serif)}",
  ".proto-strip{display:flex;gap:8px;align-items:center;padding:6px 12px;background:#111;color:#fff;font:12px/1.4 Roboto,sans-serif;flex:0 0 auto}",
  ".proto-strip button{font:inherit;color:inherit;background:transparent;border:1px solid #555;border-radius:12px;padding:2px 10px;cursor:pointer}",
  ".proto-strip button[aria-current=step]{background:#fff;color:#111;border-color:#fff}",
  ".proto-strip .proto-hint{flex:1;opacity:.8;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}",
  ".proto-stage{position:relative;flex:1 1 auto;min-height:0;overflow:auto;--proto-app-header:64px}",
  // The flow renderer sizes a screen as a 1440x960 card, because in a flow
  // strip it IS a card: rounded, shadowed, one of several. A prototype is the
  // app, so the same markup fills the window instead. Inline width/height are
  // what the renderer writes on the element, so this override has to be
  // important; one other rule in this stylesheet is too, above.
  ".proto-stage>.screen{width:100%!important;height:100%!important;border-radius:0;box-shadow:none}",
  ".proto-icon{width:1em;height:1em;vertical-align:-.125em;fill:currentColor}",
  ".proto-layer{position:absolute;z-index:20;background:var(--zen-color-bg-default,#fff);box-shadow:0 0 24px rgba(0,0,0,.18);overflow:auto}",
  ".proto-layer[hidden]{display:none}",
  // A design system class such as .ds-drawer__section sets its own
  // display and loads after the browser's own [hidden] rule, so the
  // attribute alone does not hide an element carrying one: important
  // forces it under any class the design system draws with, anywhere
  // on the stage where an author's markup lives.
  ".proto-stage [hidden]{display:none!important}",
  ".proto-layer--drawer{top:var(--proto-app-header);right:0;bottom:0;width:550px;max-width:100%}",
  ".proto-layer--panel{top:var(--proto-app-header);right:0;bottom:0;width:420px;max-width:100%}",
  ".proto-layer--modal{top:50%;left:50%;transform:translate(-50%,-50%);max-width:90%;max-height:90%}",
  // A modal sits on a scrim, and the script draws it: flow-renderer.js does the
  // same for its own modal layer, and the brief's `layers.modal.dock` says
  // "centred on a scrim". It covers the stage, so the app but never the strip,
  // and z-index 19 puts it under the modal's 20 and over everything else.
  // :has ties it to the modal's own `hidden` attribute, which is the only
  // thing the author toggles, and unlike a sibling rule it needs no ordering
  // between the two elements and stays right with more than one modal.
  ".proto-scrim{display:none;position:absolute;inset:0;z-index:19;background:var(--zen-color-bg-overlay,rgba(0,0,0,.4))}",
  ".proto-stage:has(.proto-layer--modal:not([hidden])) .proto-scrim{display:block}",
  ".proto-layer--toast{box-shadow:none;background:transparent}",
  // Bottom left: every layer this shell docks goes to the right edge (drawer,
  // panel) or the middle (modal), and the app header owns the top. A note that
  // covers the UI it annotates is worse than no note.
  ".proto-adds{display:none;position:absolute;left:12px;bottom:12px;z-index:40;background:#111;color:#fff;font:12px/1.5 Roboto,sans-serif;padding:10px 14px;border-radius:6px;max-width:360px}",
  // The page carries no list reset of its own and the bullets hang outside
  // the card, half clipped.
  ".proto-adds ul{list-style:none;margin:4px 0 0;padding:0}",
  "body[data-show-new] .proto-adds{display:block}",
  "body[data-show-new] [data-new]{outline:2px dashed #111;outline-offset:2px;position:relative}",
  "body[data-show-new] [data-new]::after{content:'NEW';position:absolute;top:-10px;right:-6px;background:#111;color:#fff;font:700 9px/1 Roboto,sans-serif;padding:2px 4px;border-radius:2px}",
].join("\n");

// Runs before the author's app.js. proto.go(n) is 1-based.
var RUNTIME = [
  "window.proto={steps:[],current:0,go:function(n){var s=this.steps[n-1];if(!s)return;this.current=n;",
  "if(typeof s.arrive==='function')s.arrive();",
  "document.querySelectorAll('[data-proto-step]').forEach(function(b){",
  "if(String(n)===b.getAttribute('data-proto-step'))b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});",
  // The rail is drawn once, active on the app's default nav; a step whose
  // PROTO_NAV entry names a different rail item moves it there by label
  // (the only thing distinguishing the active item is is-active on
  // .ds-sidenav__item, its label sitting in .ds-sidenav__label). A null
  // entry (no nav declared for this step, or an id the rail does not carry)
  // leaves the rail exactly as drawn.
  "var nl=(window.PROTO_NAV||[])[n-1];if(typeof nl==='string'){",
  "document.querySelectorAll('.ds-sidenav__item').forEach(function(it){",
  "it.classList.remove('is-active');",
  "var lb=it.querySelector('.ds-sidenav__label');",
  "if(lb&&lb.textContent.trim()===nl)it.classList.add('is-active');});}",
  "var h=document.querySelector('.proto-hint');if(h)h.textContent=(window.PROTO_HINTS||[])[n-1]||'';}",
  // An icon app.js draws with innerHTML at runtime never ran through
  // inlineIcons (assemble-direct.js), which touches body.html once, before
  // app.js exists: it stays an empty span, silently, unless something
  // replaces it after the fact. root itself is checked, not only its
  // descendants, so a span added directly (not inside a wrapper) is caught
  // too. An unlisted slug is left exactly as app.js wrote it, the same as
  // inlineIcons leaves one body.html names.
  ",icons:function(root){var m=window.PROTO_ICONS||{};function fix(el){",
  "var ic=m[el.getAttribute('data-icon')];if(!ic)return;",
  "var svg=document.createElementNS('http://www.w3.org/2000/svg','svg');",
  "svg.setAttribute('class','proto-icon');svg.setAttribute('viewBox',ic.viewBox);",
  "svg.setAttribute('aria-hidden','true');svg.innerHTML=ic.body;el.replaceWith(svg);}",
  "if(root.getAttribute&&root.getAttribute('data-icon')!=null)fix(root);",
  "if(root.querySelectorAll)Array.prototype.forEach.call(root.querySelectorAll('span[data-icon]'),fix);}};",
].join("");

// Runs after the author's app.js.
var BOOT = [
  "document.querySelectorAll('[data-proto-step]').forEach(function(b){b.addEventListener('click',function(){proto.go(+b.getAttribute('data-proto-step'));});});",
  "document.querySelector('[data-proto-new]').addEventListener('click',function(){document.body.toggleAttribute('data-show-new');});",
  "document.querySelector('[data-proto-restart]').addEventListener('click',function(){location.href=location.pathname;});",
  "var protoStage=document.querySelector('.proto-stage');proto.icons(protoStage);",
  "if(typeof MutationObserver!=='undefined'){new MutationObserver(function(muts){",
  "muts.forEach(function(mu){Array.prototype.forEach.call(mu.addedNodes,function(n){",
  "if(n.nodeType===1)proto.icons(n);});});",
  "}).observe(protoStage,{childList:true,subtree:true});}",
  "proto.go(+(new URLSearchParams(location.search).get('step'))||1);",
].join("");

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function strip(steps, adds) {
  var buttons = (steps || [])
    .map(function (s) {
      return (
        '<button type="button" data-proto-step="' +
        s.n +
        '">' +
        s.n +
        " " +
        esc(s.name) +
        "</button>"
      );
    })
    .join("");
  var list = (adds || [])
    .map(function (a) {
      return (
        "<li><strong>" + esc(a.name) + "</strong>: " + esc(a.why) + "</li>"
      );
    })
    .join("");
  return (
    '<div class="proto-strip"><strong>Prototype</strong>' +
    buttons +
    '<span class="proto-hint"></span>' +
    '<button type="button" data-proto-new>Show what is new</button>' +
    '<button type="button" data-proto-restart>Restart</button></div>' +
    '<div class="proto-adds"><strong>New in this prototype</strong><ul>' +
    list +
    "</ul></div>"
  );
}

// Emitted into the stage only when the author declares a modal layer.
var SCRIM = '<div class="proto-scrim"></div>';

module.exports = {
  CSS: CSS,
  SCRIM: SCRIM,
  RUNTIME: RUNTIME,
  BOOT: BOOT,
  strip: strip,
  esc: esc,
};
