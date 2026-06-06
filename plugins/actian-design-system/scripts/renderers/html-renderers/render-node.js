// scripts/renderers/html-renderers/render-node.js
// Shared structural-node renderer — the single source of truth for the
// Figma-node → HTML mapping consumed by BOTH generate-flow (flow-renderer.js)
// and generate-presentation (presentation-renderer.js).
//
// This is a superset of the two previously-duplicated implementations
// (flow's renderContentNode + presentation's renderSpecNode). It is
// parameterized by `opts.defaultFont` ("Inter" for flow, "Roboto" for
// presentation) and merges presentation's extra branches (textCase:"UPPER",
// size-as-object, counterAxisAlign alias) into flow's (richer) bodies.
//
// UMD: registers on `module.exports` in Node or `window.renderNode` in the
// browser, mirroring fm-html-map.js so it can be inlined by assemble-preview.js.

(function (exports) {
  "use strict";

  // -------------------------------------------------------------------------
  // Shared functions from fm-html-map (same resolution the consumers use)
  // -------------------------------------------------------------------------

  var fmMap =
    (typeof window !== "undefined" && window.fmHtmlMap) ||
    (typeof require !== "undefined" && require("./fm-html-map")) ||
    {};
  var esc =
    fmMap.esc ||
    function (str) {
      if (str == null) return "";
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    };
  var renderFMComponent =
    fmMap.renderFMComponent ||
    function () {
      return "";
    };

  // Hi-fi DS leaf map — same UMD resolution as fmMap. INSTANCE nodes flagged
  // `library: "ds"` render through this; everything else stays on the FM map.
  var dsMap =
    (typeof window !== "undefined" && window.dsHtmlMap) ||
    (typeof require !== "undefined" && require("./ds-html-map")) ||
    {};

  // -------------------------------------------------------------------------
  // Style builders for structured nodes
  // -------------------------------------------------------------------------

  var FONT_WEIGHT_MAP = {
    Regular: "400",
    Medium: "500",
    "Semi Bold": "600",
    SemiBold: "600",
    Bold: "700",
    Light: "300",
    Thin: "100",
    "Extra Bold": "800",
  };

  function buildFrameStyle(node) {
    var parts = [];
    var layout = node.layout || {};
    var sizing = node.sizing || {};

    // Flex layout
    if (layout.mode === "HORIZONTAL") {
      parts.push("display:flex", "flex-direction:row");
    } else if (layout.mode === "VERTICAL") {
      parts.push("display:flex", "flex-direction:column");
    }

    if (layout.spacing != null) {
      parts.push("gap:" + layout.spacing + "px");
    }

    // Primary axis alignment
    if (layout.primaryAxisAlignItems) {
      var alignMap = {
        SPACE_BETWEEN: "space-between",
        CENTER: "center",
        MIN: "flex-start",
        MAX: "flex-end",
      };
      var justifyVal = alignMap[layout.primaryAxisAlignItems];
      if (justifyVal) parts.push("justify-content:" + justifyVal);
    }

    // Counter axis alignment (presentation also accepts the `counterAxisAlign`
    // alias — merged in here so the superset covers both consumers).
    if (layout.counterAxisAlignItems || layout.counterAxisAlign) {
      var crossMap = {
        CENTER: "center",
        MIN: "flex-start",
        MAX: "flex-end",
      };
      var ca = layout.counterAxisAlignItems || layout.counterAxisAlign;
      var alignItemsVal = crossMap[ca];
      if (alignItemsVal) parts.push("align-items:" + alignItemsVal);
    }

    if (layout.padding) {
      var p = layout.padding;
      if (Array.isArray(p)) {
        // [top, right, bottom, left]
        parts.push(
          "padding:" +
            (p[0] || 0) +
            "px " +
            (p[1] || 0) +
            "px " +
            (p[2] || 0) +
            "px " +
            (p[3] || 0) +
            "px",
        );
      } else if (typeof p === "object") {
        var t = p.top != null ? p.top : p.vertical != null ? p.vertical : 0;
        var r =
          p.right != null ? p.right : p.horizontal != null ? p.horizontal : 0;
        var b =
          p.bottom != null ? p.bottom : p.vertical != null ? p.vertical : 0;
        var l =
          p.left != null ? p.left : p.horizontal != null ? p.horizontal : 0;
        parts.push("padding:" + t + "px " + r + "px " + b + "px " + l + "px");
      } else {
        parts.push("padding:" + p + "px");
      }
    }

    // Horizontal sizing
    if (sizing.horizontal === "FILL") {
      parts.push("flex:1", "min-width:0");
    } else if (sizing.horizontal === "HUG") {
      // default — no extra CSS
    } else if (typeof sizing.horizontal === "number") {
      parts.push("width:" + sizing.horizontal + "px", "flex-shrink:0");
    } else if (node.width != null) {
      parts.push("width:" + node.width + "px");
    }

    // Vertical sizing
    if (sizing.vertical === "FILL") {
      parts.push("flex:1", "min-height:0");
    } else if (typeof sizing.vertical === "number") {
      parts.push("height:" + sizing.vertical + "px");
    } else if (node.height != null) {
      parts.push("height:" + node.height + "px");
    }

    // Fills
    if (node.fills && node.fills.length > 0) {
      parts.push("background:" + node.fills[0]);
    }

    // Corner radius
    if (node.cornerRadius != null) {
      if (typeof node.cornerRadius === "number") {
        parts.push("border-radius:" + node.cornerRadius + "px");
      } else if (typeof node.cornerRadius === "object") {
        var cr = node.cornerRadius;
        parts.push(
          "border-radius:" +
            (cr.topLeft || 0) +
            "px " +
            (cr.topRight || 0) +
            "px " +
            (cr.bottomRight || 0) +
            "px " +
            (cr.bottomLeft || 0) +
            "px",
        );
      }
    }

    // Stroke
    if (node.stroke) {
      var stroke = node.stroke;
      var weight = stroke.weight != null ? stroke.weight : 1;
      var color = stroke.color || "#000000";
      if (stroke.sides && typeof stroke.sides === "object") {
        if (stroke.sides.top)
          parts.push("border-top:" + weight + "px solid " + color);
        if (stroke.sides.right)
          parts.push("border-right:" + weight + "px solid " + color);
        if (stroke.sides.bottom)
          parts.push("border-bottom:" + weight + "px solid " + color);
        if (stroke.sides.left)
          parts.push("border-left:" + weight + "px solid " + color);
      } else {
        parts.push("border:" + weight + "px solid " + color);
      }
    }

    // Opacity
    if (node.opacity != null) {
      parts.push("opacity:" + node.opacity);
    }

    // Clips content
    if (node.clipsContent) {
      parts.push("overflow:hidden");
    }

    return parts.join(";");
  }

  function buildTextStyle(node, opts) {
    var parts = [];
    var defaultFont = (opts && opts.defaultFont) || "Inter";

    // Font family + weight
    if (node.font) {
      var fontParts = node.font.split(":");
      var family = fontParts[0] ? fontParts[0].trim() : defaultFont;
      var weightName = fontParts[1] ? fontParts[1].trim() : "Regular";
      var weight = FONT_WEIGHT_MAP[weightName] || "400";
      parts.push("font-family:" + family);
      parts.push("font-weight:" + weight);
    }

    // Size — flow supplies a number; presentation may supply an object {value}.
    if (node.size != null) {
      var sizeVal = typeof node.size === "object" ? node.size.value : node.size;
      parts.push("font-size:" + sizeVal + "px");
    }

    if (node.color) {
      parts.push("color:" + node.color);
    }

    // Uppercase transform (presentation's textCase:"UPPER").
    if (node.textCase === "UPPER") {
      parts.push("text-transform:uppercase");
    }

    if (node.width != null) {
      parts.push("display:block", "width:" + node.width + "px");
      // Clamp overflow on fixed-width text so it can't blow out its container.
      // Multi-line text (contains \n) only clips; single-line text ellipsizes.
      // The renderer displays node.content; fall back to node.text for callers
      // (and the single-line unit test) that only supply node.text.
      var __txt = node.content != null ? node.content : node.text;
      var __multiline = typeof __txt === "string" && __txt.indexOf("\n") !== -1;
      if (__multiline) {
        parts.push("overflow:hidden");
      } else {
        parts.push(
          "overflow:hidden",
          "text-overflow:ellipsis",
          "white-space:nowrap",
        );
      }
    }

    if (node.letterSpacing != null) {
      var lsVal =
        typeof node.letterSpacing === "object"
          ? node.letterSpacing.value
          : node.letterSpacing;
      parts.push("letter-spacing:" + lsVal + "px");
    }

    // Line height — object {value,unit} (canonical) or scalar px. PERCENT unit
    // renders as %, everything else as px. Twin of render-node-figma.js emitText.
    if (node.lineHeight != null) {
      var lh = node.lineHeight;
      if (typeof lh === "object") {
        parts.push(
          "line-height:" + lh.value + (lh.unit === "PERCENT" ? "%" : "px"),
        );
      } else {
        parts.push("line-height:" + lh + "px");
      }
    }

    if (node.textAlign && node.textAlign.horizontal) {
      var align = node.textAlign.horizontal;
      if (align === "CENTER") parts.push("text-align:center");
      else if (align === "RIGHT") parts.push("text-align:right");
      else if (align === "LEFT") parts.push("text-align:left");
    }

    if (node.opacity != null) {
      parts.push("opacity:" + node.opacity);
    }

    return parts.join(";");
  }

  // -------------------------------------------------------------------------
  // renderNode — recursive structured node → HTML (superset of
  // flow.renderContentNode + presentation.renderSpecNode)
  // -------------------------------------------------------------------------

  function renderNode(node, opts) {
    if (!node) return "";

    switch (node.type) {
      case "FRAME": {
        var style = buildFrameStyle(node);
        var children = (node.children || [])
          .map(function (child) {
            return renderNode(child, opts);
          })
          .join("");
        return (
          '<div class="fm-frame" data-name="' +
          esc(node.name || "") +
          '"' +
          (style ? ' style="' + style + '"' : "") +
          ">" +
          children +
          "</div>"
        );
      }

      case "TEXT": {
        var style = buildTextStyle(node, opts);
        return (
          '<span class="fm-text" data-name="' +
          esc(node.name || "") +
          '"' +
          (style ? ' style="' + style + '"' : "") +
          ">" +
          esc(node.content || "") +
          "</span>"
        );
      }

      case "INSTANCE": {
        if (node.library === "ds" && dsMap.renderDSComponent) {
          return dsMap.renderDSComponent(node);
        }
        return renderFMComponent(node);
      }

      case "ELLIPSE": {
        var bg = (node.fills && node.fills[0]) || "#CBD2E0";
        var ellipseStyle =
          "width:" +
          (node.width || 16) +
          "px;height:" +
          (node.height || 16) +
          "px;min-width:1px;min-height:1px;border-radius:50%;background:" +
          bg;
        if (node.opacity != null) ellipseStyle += ";opacity:" + node.opacity;
        return (
          '<div class="fm-ellipse" data-name="' +
          esc(node.name || "") +
          '" style="' +
          ellipseStyle +
          '"></div>'
        );
      }

      case "RECT": {
        var rectStyle =
          "width:" +
          (node.width || 32) +
          "px;height:" +
          (node.height || 32) +
          "px;min-width:1px;min-height:1px;";
        if (node.fills && node.fills[0])
          rectStyle += "background:" + node.fills[0] + ";";
        if (node.cornerRadius)
          rectStyle +=
            "border-radius:" +
            (typeof node.cornerRadius === "number"
              ? node.cornerRadius + "px"
              : "0") +
            ";";
        return (
          '<div class="fm-rect" data-name="' +
          esc(node.name || "") +
          '" style="' +
          rectStyle +
          '"></div>'
        );
      }

      case "DIVIDER": {
        return '<hr class="fm-divider">';
      }

      default: {
        // Unknown node type — render children if present, otherwise empty
        if (node.children && node.children.length) {
          return (node.children || [])
            .map(function (child) {
              return renderNode(child, opts);
            })
            .join("");
        }
        return "";
      }
    }
  }

  // -------------------------------------------------------------------------
  // Exports (UMD tail — mirrors fm-html-map.js)
  // -------------------------------------------------------------------------

  exports.renderNode = renderNode;
  exports.buildFrameStyle = buildFrameStyle;
  exports.buildTextStyle = buildTextStyle;
  exports.FONT_WEIGHT_MAP = FONT_WEIGHT_MAP;
})(
  typeof module !== "undefined"
    ? module.exports
    : (window.renderNode = window.renderNode || {}),
);
