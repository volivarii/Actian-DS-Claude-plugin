  document.addEventListener('alpine:init', () => {
    Alpine.data('annotationLayer', () => ({
      /** Whether annotation click-to-annotate mode is active */
      active: false,

      /** All persisted annotations for this page */
      annotations: [],

      /** Whether the export panel is open */
      panelOpen: false,

      /** Brief copy-to-clipboard feedback flag */
      copyFeedback: false,

      /** Whether annotations have been submitted to the server */
      submitted: false,

      /** Popover state */
      popover: {
        open: false,
        x: 0,
        y: 0,
        target: '',
        message: '',
        severity: 'change',
        editingId: null,
        /** The actual DOM element being annotated */
        _el: null,
      },

      /** localStorage key for this page */
      _storageKey: 'anno-' + location.pathname,

      /** Injected badge elements keyed by annotation id */
      _badges: {},

      /** Currently hovered element (for outline/tooltip) */
      _hoveredEl: null,

      /** Bound event handler references (for cleanup) */
      _onDocClick: null,
      _onDocMouseover: null,
      _onDocMouseout: null,
      _onMousemove: null,

      // ─────────────────────────────────────────────
      // Lifecycle
      // ─────────────────────────────────────────────

      init() {
        this._load();
        this.renderBadges();
        this._bindHoverHandlers();
        this._bindClickCapture();
      },

      // ─────────────────────────────────────────────
      // Mode toggle
      // ─────────────────────────────────────────────

      toggleMode() {
        this.active = !this.active;
        if (!this.active) {
          this._clearHover();
          this.closePopover();
        }
        document.body.style.cursor = this.active ? 'crosshair' : '';
      },

      // ─────────────────────────────────────────────
      // Popover
      // ─────────────────────────────────────────────

      openPopover(el) {
        const rect = el.getBoundingClientRect();
        const vpW = window.innerWidth;
        const vpH = window.innerHeight;
        const popW = 280;
        const popH = 260; // approximate

        // Default: appear below-right of element
        let x = rect.left;
        let y = rect.bottom + 8;

        // Flip horizontally if overflowing right edge
        if (x + popW > vpW - 16) {
          x = Math.max(16, vpW - popW - 16);
        }
        // Flip vertically if overflowing bottom
        if (y + popH > vpH - 16) {
          y = Math.max(16, rect.top - popH - 8);
        }

        this.popover.x = Math.round(x);
        this.popover.y = Math.round(y);
        this.popover.target = el.dataset.name || el.tagName.toLowerCase();
        this.popover._el = el;

        // Focus textarea after Alpine re-renders
        this.$nextTick(() => {
          const ta = document.getElementById('anno-popover-textarea');
          if (ta) ta.focus();
        });
      },

      closePopover() {
        this.popover.open = false;
        this.popover.editingId = null;
        this.popover.message = '';
        this.popover.severity = 'note';
        this.popover._el = null;
      },

      // ─────────────────────────────────────────────
      // CRUD
      // ─────────────────────────────────────────────

      saveAnnotation() {
        const msg = this.popover.message.trim();
        if (!msg) return;

        if (this.popover.editingId !== null) {
          // Update existing
          const idx = this.annotations.findIndex(a => a.id === this.popover.editingId);
          if (idx !== -1) {
            this.annotations[idx].message = msg;
            this.annotations[idx].severity = this.popover.severity;
          }
        } else {
          // Create new — store targetIndex to disambiguate duplicate data-name values
          const allMatches = document.querySelectorAll(`[data-name="${CSS.escape(this.popover.target)}"]`);
          let targetIndex = 0;
          allMatches.forEach((el, i) => { if (el === this.popover._el) targetIndex = i; });

          this.annotations.push({
            id: Date.now() + Math.random(),
            target: this.popover.target,
            targetIndex: targetIndex,
            message: msg,
            severity: this.popover.severity,
            createdAt: new Date().toISOString(),
            _el: this.popover._el,
          });
        }

        this.submitted = false;
        this.persist();
        this.renderBadges();
        this.closePopover();
      },

      deleteAnnotation(id) {
        this.annotations = this.annotations.filter(a => a.id !== id);
        this._removeBadge(id);
        this.persist();
        this.closePopover();
      },

      clearAll() {
        if (!confirm('Clear all annotations for this page?')) return;
        this.annotations = [];
        Object.keys(this._badges).forEach(id => this._removeBadge(id));
        this._badges = {};
        this.persist();
      },

      editAnnotation(a) {
        // Re-resolve element (may have been GC'd if DOM changed)
        const el = a._el || document.querySelector(`[data-name="${CSS.escape(a.target)}"]`);
        this.popover.editingId = a.id;
        this.popover.message = a.message;
        this.popover.severity = a.severity;
        this.popover.target = a.target;
        this.popover._el = el;
        this.popover.open = true;

        if (el) {
          this.openPopover(el);
          // openPopover resets message/severity — restore after
          this.$nextTick(() => {
            this.popover.message = a.message;
            this.popover.severity = a.severity;
            this.popover.editingId = a.id;
            const ta = document.getElementById('anno-popover-textarea');
            if (ta) ta.focus();
          });
        }
      },

      // ─────────────────────────────────────────────
      // Persistence
      // ─────────────────────────────────────────────

      persist() {
        try {
          const serialisable = this.annotations.map(a => ({
            id: a.id,
            target: a.target,
            targetIndex: a.targetIndex || 0,
            message: a.message,
            severity: a.severity,
            createdAt: a.createdAt,
          }));
          localStorage.setItem(this._storageKey, JSON.stringify(serialisable));
        } catch (e) {
          // localStorage may be unavailable (e.g., private browsing with full quota)
          console.warn('[annotation-layer] Could not persist to localStorage:', e);
        }
      },

      _load() {
        try {
          const raw = localStorage.getItem(this._storageKey);
          if (raw) {
            const parsed = JSON.parse(raw);
            // Re-hydrate with _el references, using targetIndex for disambiguation
            this.annotations = parsed.map(a => {
              const allMatches = document.querySelectorAll(`[data-name="${CSS.escape(a.target)}"]`);
              return {
                ...a,
                _el: allMatches[a.targetIndex || 0] || allMatches[0] || null,
              };
            });
          }
        } catch (e) {
          console.warn('[annotation-layer] Could not load from localStorage:', e);
        }
      },

      // ─────────────────────────────────────────────
      // Badges
      // ─────────────────────────────────────────────

      renderBadges() {
        // Remove all existing badges first
        document.querySelectorAll('.anno-badge').forEach(b => b.remove());
        this._badges = {};

        this.annotations.forEach((a, idx) => {
          // Use targetIndex to find the correct element when multiple share the same data-name
          let el = a._el;
          if (!el) {
            const allMatches = document.querySelectorAll(`[data-name="${CSS.escape(a.target)}"]`);
            el = allMatches[a.targetIndex || 0] || allMatches[0];
          }
          if (!el) return;

          // Ensure the target element has position context for the badge
          const pos = getComputedStyle(el).position;
          if (pos === 'static') {
            el.style.position = 'relative';
          }

          const badge = document.createElement('button');
          badge.className = 'anno-badge';
          badge.textContent = idx + 1;
          badge.setAttribute('aria-label', `Annotation ${idx + 1}: ${a.target}`);
          badge.setAttribute('type', 'button');
          badge.addEventListener('click', (e) => {
            e.stopPropagation();
            this.editAnnotation(a);
          });

          el.appendChild(badge);
          this._badges[a.id] = badge;
        });
      },

      _removeBadge(id) {
        if (this._badges[id]) {
          this._badges[id].remove();
          delete this._badges[id];
        }
        // Re-render to renumber remaining badges
        this.renderBadges();
      },

      // ─────────────────────────────────────────────
      // Export
      // ─────────────────────────────────────────────

      exportJSON() {
        const payload = {
          source: 'browser-preview',
          previewUrl: location.href,
          exportedAt: new Date().toISOString(),
          annotations: this.annotations.map(a => ({
            id: a.id,
            target: a.target,
            targetIndex: a.targetIndex || 0,
            message: a.message,
            severity: a.severity,
            createdAt: a.createdAt,
          })),
        };
        const json = JSON.stringify(payload, null, 2);

        // Clipboard API with execCommand fallback
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(json).then(() => this._showCopyFeedback()).catch(() => this._copyFallback(json));
        } else {
          this._copyFallback(json);
        }
      },

      async submitAnnotations() {
        const payload = {
          source: 'browser-preview',
          previewUrl: location.href,
          exportedAt: new Date().toISOString(),
          annotations: this.annotations.map(a => ({
            id: a.id,
            target: a.target,
            targetIndex: a.targetIndex || 0,
            message: a.message,
            severity: a.severity,
            createdAt: a.createdAt,
          })),
        };
        try {
          const res = await fetch('/_annotations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload, null, 2),
          });
          if (res.ok) {
            this.submitted = true;
            // Clear annotations from localStorage so they don't reappear after reload
            localStorage.removeItem(this._storageKey);
          } else {
            // Fallback: copy to clipboard instead
            console.warn('[annotation-layer] Server POST failed, falling back to clipboard');
            this.exportJSON();
            this._showServerlessHint();
          }
        } catch (e) {
          // Server doesn't support POST (e.g., file:// or Cowork sandbox) — copy to clipboard
          console.warn('[annotation-layer] POST not available, copying to clipboard');
          this.exportJSON();
          this._showServerlessHint();
        }
      },

      _copyFallback(text) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        try {
          document.execCommand('copy');
          this._showCopyFeedback();
        } catch (e) {
          console.warn('[annotation-layer] Copy failed:', e);
          prompt('Copy the JSON below:', text);
        }
        document.body.removeChild(ta);
      },

      _showCopyFeedback() {
        this.copyFeedback = true;
        setTimeout(() => { this.copyFeedback = false; }, 2200);
      },

      _showServerlessHint() {
        const toast = document.createElement('div');
        toast.innerHTML = 'Annotations copied to clipboard.<br>Paste into the chat to apply.';
        toast.style.cssText = `
          position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
          z-index: 99999; background: #1e40af; color: #fff;
          font-family: Inter, system-ui, sans-serif; font-size: 14px; font-weight: 500;
          padding: 12px 24px; border-radius: 10px; text-align: center; line-height: 1.5;
          box-shadow: 0 4px 16px rgba(0,0,0,0.2);
          opacity: 0; transition: opacity 0.3s;
        `;
        document.body.appendChild(toast);
        requestAnimationFrame(() => { toast.style.opacity = '1'; });
        setTimeout(() => {
          toast.style.opacity = '0';
          setTimeout(() => toast.remove(), 300);
        }, 4000);
      },

      // ─────────────────────────────────────────────
      // Event handlers
      // ─────────────────────────────────────────────

      _bindClickCapture() {
        this._onDocClick = (e) => {
          if (!this.active) return;

          // Ignore clicks inside annotation UI
          const root = document.getElementById('anno-root');
          if (root && root.contains(e.target)) return;

          // Find the closest [data-name] ancestor
          const el = e.target.closest('[data-name]');
          if (!el) return;

          e.preventDefault();
          e.stopPropagation();

          this.popover.editingId = null;
          this.popover.message = '';
          this.popover.severity = 'note';
          this.popover.open = true;
          this.openPopover(el);
        };
        document.addEventListener('click', this._onDocClick, true);
      },

      _bindHoverHandlers() {
        const tooltip = document.getElementById('anno-hover-tooltip');

        this._onDocMouseover = (e) => {
          if (!this.active) return;
          const root = document.getElementById('anno-root');
          if (root && root.contains(e.target)) return;

          const el = e.target.closest('[data-name]');
          if (!el) return;

          if (this._hoveredEl && this._hoveredEl !== el) {
            this._hoveredEl.classList.remove('anno-highlight');
          }
          el.classList.add('anno-highlight');
          this._hoveredEl = el;

          if (tooltip) {
            tooltip.textContent = el.dataset.name;
            tooltip.classList.add('anno-hover-tooltip--visible');
          }
        };

        this._onDocMouseout = (e) => {
          if (!this.active) return;
          const el = e.target.closest('[data-name]');
          if (!el) return;

          // Only clear if we're leaving the element entirely (not moving to a child)
          if (!el.contains(e.relatedTarget)) {
            el.classList.remove('anno-highlight');
            if (this._hoveredEl === el) this._hoveredEl = null;
            if (tooltip) tooltip.classList.remove('anno-hover-tooltip--visible');
          }
        };

        this._onMousemove = (e) => {
          if (!this.active || !tooltip) return;
          if (!tooltip.classList.contains('anno-hover-tooltip--visible')) return;
          const offset = 14;
          const tw = tooltip.offsetWidth;
          const th = tooltip.offsetHeight;
          let tx = e.clientX + offset;
          let ty = e.clientY + offset;
          if (tx + tw > window.innerWidth - 8) tx = e.clientX - tw - offset;
          if (ty + th > window.innerHeight - 8) ty = e.clientY - th - offset;
          tooltip.style.left = tx + 'px';
          tooltip.style.top = ty + 'px';
        };

        document.addEventListener('mouseover', this._onDocMouseover, true);
        document.addEventListener('mouseout', this._onDocMouseout, true);
        document.addEventListener('mousemove', this._onMousemove, true);
      },

      _clearHover() {
        if (this._hoveredEl) {
          this._hoveredEl.classList.remove('anno-highlight');
          this._hoveredEl = null;
        }
        const tooltip = document.getElementById('anno-hover-tooltip');
        if (tooltip) {
          tooltip.classList.remove('anno-hover-tooltip--visible');
        }
        document.body.style.cursor = '';
      },
    }));
  });

  // Live reload — polls /_version endpoint for file mtime changes
  (function() {
    let lastMtime = null;
    const filePath = location.pathname;
    setInterval(async () => {
      try {
        const res = await fetch(`/_version?file=${encodeURIComponent(filePath)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (lastMtime !== null && data.mtime !== lastMtime) {
          sessionStorage.setItem('anno-reload-toast', '1');
          location.reload();
        }
        lastMtime = data.mtime;
      } catch(e) {}
    }, 1500);

    // Show toast if we just reloaded from a file change
    if (sessionStorage.getItem('anno-reload-toast')) {
      sessionStorage.removeItem('anno-reload-toast');
      const toast = document.createElement('div');
      toast.textContent = 'Changes applied';
      toast.style.cssText = `
        position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
        z-index: 99999; background: #166534; color: #fff;
        font-family: Inter, system-ui, sans-serif; font-size: 13px; font-weight: 500;
        padding: 8px 20px; border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        opacity: 0; transition: opacity 0.3s;
      `;
      document.body.appendChild(toast);
      requestAnimationFrame(() => { toast.style.opacity = '1'; });
      setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
      }, 2500);
    }
  })();

