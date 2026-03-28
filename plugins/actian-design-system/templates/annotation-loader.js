/**
 * Annotation Layer Loader
 * Loads CSS, registers Alpine.data, injects HTML, then starts Alpine.
 * Skills add ONE script tag: <script src="/_plugin/annotation-loader.js"></script>
 * Must NOT use defer — needs to run before Alpine auto-starts.
 */
(function() {
  'use strict';
  var base = '/_plugin/';

  // Step 1: Load CSS immediately
  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = base + 'annotation-layer.css';
  document.head.appendChild(link);

  // Step 2: When DOM is ready, load JS then HTML then Alpine (in order)
  function boot() {
    // Load the annotation JS (defines Alpine.data('annotationLayer'))
    fetch(base + 'annotation-layer.js')
      .then(function(r) { return r.text(); })
      .then(function(js) {
        // Execute JS synchronously so Alpine.data is registered
        var s = document.createElement('script');
        s.textContent = js;
        document.head.appendChild(s);
      })
      .then(function() {
        // Load and inject HTML markup
        return fetch(base + 'annotation-layer-markup.html');
      })
      .then(function(r) { return r.text(); })
      .then(function(html) {
        var div = document.createElement('div');
        div.innerHTML = html;
        while (div.firstChild) document.body.appendChild(div.firstChild);
      })
      .then(function() {
        // NOW load Alpine — data is registered, markup is in DOM
        if (!window.Alpine) {
          var alpine = document.createElement('script');
          alpine.src = 'https://cdn.jsdelivr.net/npm/alpinejs@3.14.9/dist/cdn.min.js';
          document.head.appendChild(alpine);
        } else {
          // Alpine already loaded (e.g. prototype page) — re-init the new markup
          Alpine.initTree(document.getElementById('anno-root'));
        }
      })
      .catch(function(e) {
        console.warn('[annotation-loader] Failed:', e);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
