// Figma JSON Spec Interpreter v1.0.0
// Builds Figma node trees from declarative JSON specs.
// Runs inside Figma Plugin API sandbox — no Node.js APIs.

// ─── Entry Point ───────────────────────────────────────────────────────────────

async function buildFromSpec(spec) {
  // 1. Navigate to target page
  const targetNode = await figma.getNodeByIdAsync(spec.meta.targetNodeId);
  let page = targetNode;
  while (page && page.type !== 'PAGE') page = page.parent;
  if (page) await figma.setCurrentPageAsync(page);

  // 2. Load all fonts
  await Promise.all((spec.fonts || []).map(function (f) {
    var parts = f.split(':');
    return figma.loadFontAsync({ family: parts[0], style: parts[1].trim() });
  }));

  // 3. Import all components, cache in ctx
  var ctx = { imports: {}, variables: {}, styles: {} };
  for (var ref in (spec.imports || {})) {
    var def = spec.imports[ref];
    ctx.imports[ref] = def.method === 'set'
      ? await figma.importComponentSetByKeyAsync(def.key)
      : await figma.importComponentByKeyAsync(def.key);
  }

  // 4. Import all variables, cache in ctx
  for (var vRef in (spec.variables || {})) {
    ctx.variables[vRef] = await figma.variables.importVariableByKeyAsync(spec.variables[vRef].key);
  }

  // 5. Import all styles, cache in ctx
  for (var sRef in (spec.styles || {})) {
    ctx.styles[sRef] = await figma.importStyleByKeyAsync(spec.styles[sRef].key);
  }

  // 5.5. Resolve local components by node ID (for instances in the same file)
  ctx.localComponents = {};
  for (var lcRef in (spec.localComponents || {})) {
    ctx.localComponents[lcRef] = await figma.getNodeByIdAsync(spec.localComponents[lcRef].nodeId);
  }

  // 6. Create or find wrapper frame
  var wrapper;
  if (spec.meta.appendToId) {
    wrapper = await figma.getNodeByIdAsync(spec.meta.appendToId);
    if (!wrapper) throw new Error('Wrapper ' + spec.meta.appendToId + ' not found');
  } else {
    wrapper = figma.createFrame();
    wrapper.name = spec.meta.wrapperName || (spec.meta.skill + ': ' + (spec.meta.component || 'output'));
    wrapper.layoutMode = 'HORIZONTAL';
    wrapper.itemSpacing = 32;
    wrapper.primaryAxisSizingMode = 'AUTO';
    wrapper.counterAxisSizingMode = 'AUTO';
    wrapper.fills = [];
  }

  // 7. Build tree recursively
  var nodeCount = 0;
  var cardCount = 0;
  var treeNodes = Array.isArray(spec.tree) ? spec.tree : spec.tree ? [spec.tree] : [];
  for (var i = 0; i < treeNodes.length; i++) {
    var childSpec = treeNodes[i];
    var child = await buildNode(childSpec, ctx);
    wrapper.appendChild(child);
    applySizing(child, childSpec.sizing);
    nodeCount++;
    if (childSpec.type === 'INSTANCE' && childSpec.ref) cardCount++;
  }

  // 8. Wrap in a SECTION and position clear of existing content (only for new wrappers)
  if (!spec.meta.appendToId) {
    var section = figma.createSection();
    section.name = spec.meta.sectionName || spec.meta.wrapperName || (spec.meta.skill + ': ' + (spec.meta.component || 'output'));
    section.appendChild(wrapper);

    // Position below all existing content on the page
    var parentPage = targetNode && targetNode.type === 'PAGE' ? targetNode : figma.currentPage;
    var maxBottom = 0;
    var pageChildren = parentPage.children;
    for (var p = 0; p < pageChildren.length; p++) {
      var existing = pageChildren[p];
      if (existing.id === section.id) continue;
      var ey = typeof existing.y === 'number' && isFinite(existing.y) ? existing.y : 0;
      var eh = typeof existing.height === 'number' && isFinite(existing.height) ? existing.height : 0;
      var bottom = ey + eh;
      if (bottom > maxBottom) maxBottom = bottom;
    }
    section.x = 0;
    section.y = maxBottom + 200;
  }

  // 9. Tag wrapper with plugin data
  wrapper.setSharedPluginData('actian_ds', 'skill', spec.meta.skill || '');
  wrapper.setSharedPluginData('actian_ds', 'pushed_at', new Date().toISOString());

  return { wrapperId: wrapper.id, nodeCount: nodeCount, cardCount: cardCount, sectionId: spec.meta.appendToId ? undefined : section.id };
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Convert "#RRGGBB" to { r, g, b } in 0-1 range */
function hexToRgb(hex) {
  var h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16) / 255,
    g: parseInt(h.substring(2, 4), 16) / 255,
    b: parseInt(h.substring(4, 6), 16) / 255
  };
}

/** Convert gradient angle (degrees) to Figma 2x3 transform matrix */
function angleToTransform(angleDeg) {
  var rad = (angleDeg * Math.PI) / 180;
  var cos = Math.cos(rad);
  var sin = Math.sin(rad);
  // Figma gradient transform: maps from gradient space to object space
  // Center at (0.5, 0.5), rotate, then translate back
  return [
    [cos, sin, 0.5 - 0.5 * cos - 0.5 * sin],
    [-sin, cos, 0.5 + 0.5 * sin - 0.5 * cos]
  ];
}

/** Apply fills. Array of hex strings or gradient objects. Empty array = transparent. */
function applyFills(node, fills) {
  if (fills == null) return;
  if (Array.isArray(fills) && fills.length === 0) { node.fills = []; return; }
  node.fills = (Array.isArray(fills) ? fills : [fills]).map(function (f) {
    if (typeof f === 'string') return { type: 'SOLID', color: hexToRgb(f) };
    // Gradient: { type: LINEAR|RADIAL|ANGULAR|DIAMOND, stops, angle }
    var typeMap = { LINEAR: 'GRADIENT_LINEAR', RADIAL: 'GRADIENT_RADIAL',
      ANGULAR: 'GRADIENT_ANGULAR', DIAMOND: 'GRADIENT_DIAMOND' };
    if (typeMap[f.type]) {
      return {
        type: typeMap[f.type],
        gradientStops: (f.stops || []).map(function (s) {
          var c = hexToRgb(s.color);
          return { position: s.position, color: { r: c.r, g: c.g, b: c.b, a: s.opacity != null ? s.opacity : 1 } };
        }),
        gradientTransform: f.angle != null ? angleToTransform(f.angle) : [[1, 0, 0], [0, 1, 0]]
      };
    }
    return f; // pass through already-formatted Figma fill objects
  });
}

/** Apply stroke: { color, weight, align, sides: { top, right, bottom, left } } */
function applyStroke(node, stroke) {
  if (!stroke) return;
  if (stroke.color) node.strokes = [{ type: 'SOLID', color: hexToRgb(stroke.color) }];
  if (stroke.weight != null) node.strokeWeight = stroke.weight;
  if (stroke.align) node.strokeAlign = stroke.align;
  if (stroke.sides) {
    if (stroke.sides.top === false) node.strokeTopWeight = 0;
    if (stroke.sides.right === false) node.strokeRightWeight = 0;
    if (stroke.sides.bottom === false) node.strokeBottomWeight = 0;
    if (stroke.sides.left === false) node.strokeLeftWeight = 0;
  }
}

/** Apply effects: [{type, color, opacity, offset:{x,y}, radius, spread}] */
function applyEffects(node, effects) {
  if (!effects || !effects.length) return;
  node.effects = effects.map(function (e) {
    var eff = { type: e.type, visible: true };
    if (e.type === 'DROP_SHADOW' || e.type === 'INNER_SHADOW') {
      var c = hexToRgb(e.color);
      eff.color = { r: c.r, g: c.g, b: c.b, a: e.opacity != null ? e.opacity : 0.25 };
      eff.offset = { x: (e.offset && e.offset.x) || 0, y: (e.offset && e.offset.y) || 0 };
      eff.radius = e.radius || 0;
      if (e.spread != null) eff.spread = e.spread;
    } else if (e.type === 'LAYER_BLUR' || e.type === 'BACKGROUND_BLUR') {
      eff.radius = e.radius || 0;
    }
    return eff;
  });
}

function applyOpacity(node, opacity) { if (opacity != null) node.opacity = opacity; }

function applyCornerRadius(node, cr) {
  if (cr == null) return;
  if (typeof cr === 'number') { node.cornerRadius = cr; return; }
  if (cr.topLeft != null) node.topLeftRadius = cr.topLeft;
  if (cr.topRight != null) node.topRightRadius = cr.topRight;
  if (cr.bottomRight != null) node.bottomRightRadius = cr.bottomRight;
  if (cr.bottomLeft != null) node.bottomLeftRadius = cr.bottomLeft;
}

/** Apply auto-layout. Padding is [top, right, bottom, left] array. */
function applyLayout(frame, layout) {
  if (!layout) return;
  if (layout.mode && layout.mode !== 'NONE') frame.layoutMode = layout.mode;
  if (layout.spacing != null) frame.itemSpacing = layout.spacing;
  if (layout.counterAxisSpacing != null) frame.counterAxisSpacing = layout.counterAxisSpacing;
  if (layout.wrap) frame.layoutWrap = 'WRAP';

  // Padding: [top, right, bottom, left] array per spec
  if (Array.isArray(layout.padding)) {
    frame.paddingTop = layout.padding[0];
    frame.paddingRight = layout.padding[1];
    frame.paddingBottom = layout.padding[2];
    frame.paddingLeft = layout.padding[3];
  }

  if (layout.primaryAxisAlign) frame.primaryAxisAlignItems = layout.primaryAxisAlign;
  if (layout.counterAxisAlign) frame.counterAxisAlignItems = layout.counterAxisAlign;

  frame.primaryAxisSizingMode = 'AUTO';
  frame.counterAxisSizingMode = 'AUTO';
}

/** Apply sizing. MUST be called AFTER appendChild. Values: 'FILL', 'HUG', or number (fixed px). */
function applySizing(node, sizing) {
  if (!sizing) return;
  // FILL/HUG only work inside auto-layout parents
  var parentAL = node.parent && node.parent.layoutMode && node.parent.layoutMode !== 'NONE';
  var h = sizing.horizontal;
  if (h === 'FILL' && parentAL) node.layoutSizingHorizontal = 'FILL';
  else if (h === 'HUG') node.layoutSizingHorizontal = 'HUG';
  else if (typeof h === 'number') { node.layoutSizingHorizontal = 'FIXED'; node.resize(h, node.height); }

  var v = sizing.vertical;
  if (v === 'FILL' && parentAL) node.layoutSizingVertical = 'FILL';
  else if (v === 'HUG') node.layoutSizingVertical = 'HUG';
  else if (typeof v === 'number') { node.layoutSizingVertical = 'FIXED'; node.resize(node.width, v); }

  if (sizing.minWidth != null) node.minWidth = sizing.minWidth;
  if (sizing.maxWidth != null) node.maxWidth = sizing.maxWidth;
  if (sizing.minHeight != null) node.minHeight = sizing.minHeight;
  if (sizing.maxHeight != null) node.maxHeight = sizing.maxHeight;
}

/** Set a component property by prefix matching (e.g., "Label" matches "Label#1234:0") */
function setProp(instance, prefix, value) {
  var props = instance.componentProperties;
  for (var key in props) {
    // Match property name prefix before the '#' separator
    var propName = key.split('#')[0];
    if (propName === prefix) {
      instance.setProperties({ [key]: value });
      return;
    }
  }
}

/** Apply variable bindings. Routes: fills.N.color → setBoundVariableForPaint,
 *  effects.N.* → setBoundVariableForEffect, scalars → setBoundVariable */
function applyVariables(node, variables, ctx) {
  if (!variables) return;
  for (var field in variables) {
    var variable = ctx.variables[variables[field]];
    if (!variable) continue;

    var parts = field.split('.');
    if ((parts[0] === 'fills' || parts[0] === 'strokes') && parts.length >= 3) {
      // Paint binding: fills.0.color or strokes.0.color
      var prop = parts[0];
      var idx = parseInt(parts[1], 10);
      var arr = JSON.parse(JSON.stringify(node[prop] || []));
      if (arr[idx]) {
        arr[idx] = figma.variables.setBoundVariableForPaint(arr[idx], parts[2], variable);
        node[prop] = arr;
      }
    } else if (parts[0] === 'effects' && parts.length >= 3) {
      // Effect binding: effects.0.color, effects.0.radius, etc.
      var eIdx = parseInt(parts[1], 10);
      var arr2 = JSON.parse(JSON.stringify(node.effects || []));
      if (arr2[eIdx]) {
        arr2[eIdx] = figma.variables.setBoundVariableForEffect(arr2[eIdx], parts[2], variable);
        node.effects = arr2;
      }
    } else {
      // Scalar binding: paddingTop, opacity, fontSize, cornerRadius, etc.
      node.setBoundVariable(field, variable);
    }
  }
}

/** Apply shared styles (text, fill, stroke, effect, grid) to a node */
async function applyStyles(node, styles, ctx) {
  if (!styles) return;
  if (styles.text && ctx.styles[styles.text]) {
    await node.setTextStyleIdAsync(ctx.styles[styles.text].id);
  }
  if (styles.fill && ctx.styles[styles.fill]) {
    await node.setFillStyleIdAsync(ctx.styles[styles.fill].id);
  }
  if (styles.stroke && ctx.styles[styles.stroke]) {
    await node.setStrokeStyleIdAsync(ctx.styles[styles.stroke].id);
  }
  if (styles.effect && ctx.styles[styles.effect]) {
    await node.setEffectStyleIdAsync(ctx.styles[styles.effect].id);
  }
  if (styles.grid && ctx.styles[styles.grid]) {
    await node.setGridStyleIdAsync(ctx.styles[styles.grid].id);
  }
}

// ─── Node Dispatcher ───────────────────────────────────────────────────────────

/** Dispatch node creation based on spec.type */
async function buildNode(spec, ctx) {
  switch (spec.type) {
    // Tier 1
    case 'FRAME':    return await buildFrame(spec, ctx);
    case 'TEXT':     return await buildText(spec, ctx);
    case 'RECT':     return await buildRect(spec, ctx);
    case 'INSTANCE': return await buildInstance(spec, ctx);
    case 'DIVIDER':  return await buildDivider(spec, ctx);
    // Tier 2
    case 'LINE':     return await buildLine(spec, ctx);
    case 'ELLIPSE':  return await buildEllipse(spec, ctx);
    case 'VECTOR':   return await buildVector(spec, ctx);
    case 'POLYGON':  return await buildPolygon(spec, ctx);
    case 'STAR':     return await buildStar(spec, ctx);
    case 'SVG':      return await buildSvg(spec, ctx);
    // Tier 3
    case 'GROUP':    return await buildGroup(spec, ctx);
    case 'BOOLEAN':  return await buildBoolean(spec, ctx);
    case 'SECTION':  return await buildSection(spec, ctx);
    // Tier 4 — Component authoring
    case 'COMPONENT':     return await buildComponent(spec, ctx);
    case 'COMPONENT_SET': return await buildComponentSet(spec, ctx);
    // Local component instances (same-file components referenced by node ID)
    case 'LOCAL_INSTANCE': return await buildLocalInstance(spec, ctx);
    default:
      throw new Error('Unknown node type: ' + spec.type);
  }
}

// ─── Tier 1 Builders ──────────────────────────────────────────────────────────

/** Build a FRAME node. Sets layoutMode BEFORE appending children. */
async function buildFrame(spec, ctx) {
  var frame = figma.createFrame();
  if (spec.name) frame.name = spec.name;

  // Layout MUST be set before children are appended
  applyLayout(frame, spec.layout);

  // Visual properties
  applyFills(frame, spec.fills);
  applyCornerRadius(frame, spec.cornerRadius);
  applyStroke(frame, spec.stroke);
  applyEffects(frame, spec.effects);
  applyOpacity(frame, spec.opacity);

  // Clip contents
  if (spec.clipsContent !== undefined) frame.clipsContent = spec.clipsContent;

  // Fixed size before children (if no auto-layout sizing)
  if (spec.width !== undefined && spec.height !== undefined) {
    frame.resize(spec.width, spec.height);
  }

  // Build children
  if (spec.children) {
    for (var i = 0; i < spec.children.length; i++) {
      var child = await buildNode(spec.children[i], ctx);
      frame.appendChild(child);
      applySizing(child, spec.children[i].sizing);
    }
  }

  // Styles and variables (after children for correct context)
  await applyStyles(frame, spec.styles, ctx);
  applyVariables(frame, spec.variables, ctx);

  return frame;
}

/** Build a TEXT node */
async function buildText(spec, ctx) {
  var text = figma.createText();
  if (spec.name) text.name = spec.name;

  // Font: "Family:Style" format
  var fontFamily = 'Inter';
  var fontStyle = 'Regular';
  if (spec.font) {
    var parts = spec.font.split(':');
    fontFamily = parts[0];
    fontStyle = parts[1] ? parts[1].trim() : 'Regular';
  }
  // Bold shorthand overrides style
  if (spec.bold) fontStyle = 'Bold';

  await figma.loadFontAsync({ family: fontFamily, style: fontStyle });
  text.fontName = { family: fontFamily, style: fontStyle };

  // Size
  if (spec.size !== undefined) text.fontSize = spec.size;

  // Content
  if (spec.content !== undefined) text.characters = String(spec.content);

  // Color
  if (spec.color) {
    text.fills = [{ type: 'SOLID', color: hexToRgb(spec.color) }];
  }

  // Fixed width with height auto-resize
  if (spec.width !== undefined) {
    text.resize(spec.width, text.height);
    text.textAutoResize = 'HEIGHT';
  }

  // Text alignment: { horizontal, vertical }
  if (spec.textAlign) {
    if (spec.textAlign.horizontal) text.textAlignHorizontal = spec.textAlign.horizontal;
    if (spec.textAlign.vertical) text.textAlignVertical = spec.textAlign.vertical;
  }
  if (spec.lineHeight !== undefined) {
    if (typeof spec.lineHeight === 'number') {
      text.lineHeight = { value: spec.lineHeight, unit: 'PIXELS' };
    } else if (spec.lineHeight === 'AUTO') {
      text.lineHeight = { unit: 'AUTO' };
    } else if (typeof spec.lineHeight === 'object') {
      text.lineHeight = spec.lineHeight; // { value, unit }
    }
  }
  if (spec.letterSpacing !== undefined) {
    if (typeof spec.letterSpacing === 'number') {
      text.letterSpacing = { value: spec.letterSpacing, unit: 'PIXELS' };
    } else {
      text.letterSpacing = spec.letterSpacing; // { value, unit }
    }
  }
  if (spec.textDecoration) text.textDecoration = spec.textDecoration; // NONE, UNDERLINE, STRIKETHROUGH
  if (spec.textCase) text.textCase = spec.textCase; // ORIGINAL, UPPER, LOWER, TITLE

  applyOpacity(text, spec.opacity);

  // Text ranges for syntax coloring or mixed styles
  if (spec.textRanges && spec.textRanges.length) {
    for (var i = 0; i < spec.textRanges.length; i++) {
      var range = spec.textRanges[i];
      if (range.font) {
        var rParts = range.font.split(':');
        var rFamily = rParts[0];
        var rStyle = rParts[1] ? rParts[1].trim() : 'Regular';
        await figma.loadFontAsync({ family: rFamily, style: rStyle });
        text.setRangeFontName(range.start, range.end, { family: rFamily, style: rStyle });
      }
      if (range.size !== undefined) {
        text.setRangeFontSize(range.start, range.end, range.size);
      }
      if (range.color) {
        text.setRangeFills(range.start, range.end, [{ type: 'SOLID', color: hexToRgb(range.color) }]);
      }
      if (range.textDecoration) {
        text.setRangeTextDecoration(range.start, range.end, range.textDecoration);
      }
      if (range.textCase) {
        text.setRangeTextCase(range.start, range.end, range.textCase);
      }
    }
  }

  // Styles and variables
  await applyStyles(text, spec.styles, ctx);
  applyVariables(text, spec.variables, ctx);

  return text;
}

/** Build a RECTANGLE node */
async function buildRect(spec, ctx) {
  var rect = figma.createRectangle();
  if (spec.name) rect.name = spec.name;
  if (spec.width !== undefined && spec.height !== undefined) {
    rect.resize(spec.width, spec.height);
  }
  applyFills(rect, spec.fills);
  applyCornerRadius(rect, spec.cornerRadius);
  applyStroke(rect, spec.stroke);
  applyEffects(rect, spec.effects);
  applyOpacity(rect, spec.opacity);

  await applyStyles(rect, spec.styles, ctx);
  applyVariables(rect, spec.variables, ctx);

  return rect;
}

/** Build a component INSTANCE node */
async function buildInstance(spec, ctx) {
  var componentOrSet = ctx.imports[spec.ref];
  if (!componentOrSet) throw new Error('Import ref not found: ' + spec.ref);

  var instance;
  if (spec.variant && componentOrSet.type === 'COMPONENT_SET') {
    // Find variant by name matching (e.g., "Size=Large, State=Default")
    var variants = componentOrSet.children;
    var target = null;
    for (var i = 0; i < variants.length; i++) {
      if (variants[i].name === spec.variant) {
        target = variants[i];
        break;
      }
    }
    if (!target) {
      // Partial match: check if variant name contains the spec string
      for (var j = 0; j < variants.length; j++) {
        if (variants[j].name.indexOf(spec.variant) !== -1) {
          target = variants[j];
          break;
        }
      }
    }
    if (target) {
      instance = target.createInstance();
    } else {
      // Fallback: use default variant
      instance = componentOrSet.defaultVariant
        ? componentOrSet.defaultVariant.createInstance()
        : variants[0].createInstance();
    }
  } else if (componentOrSet.type === 'COMPONENT_SET') {
    // No variant specified, use default
    instance = componentOrSet.defaultVariant
      ? componentOrSet.defaultVariant.createInstance()
      : componentOrSet.children[0].createInstance();
  } else {
    instance = componentOrSet.createInstance();
  }

  if (spec.name) instance.name = spec.name;

  // Set component properties BEFORE detach
  if (spec.props) {
    for (var prop in spec.props) {
      setProp(instance, prop, spec.props[prop]);
    }
  }

  // Detach if requested (converts to frame for full editing)
  if (spec.detach) {
    instance = instance.detachInstance();
  }

  // Override fills
  applyFills(instance, spec.fills);

  // Append children into content slot (or instance root)
  if (spec.children && spec.children.length) {
    var slot = instance.findOne(function (n) {
      return n.name === 'Content' || n.name === 'Content Area';
    });
    // If slot is inside a nested instance, detach that instance first
    if (slot) {
      var p = slot.parent;
      while (p && p !== instance) {
        if (p.type === 'INSTANCE') {
          var detached = p.detachInstance();
          // Re-find slot after detach (node references may change)
          slot = instance.findOne(function (n) {
            return n.name === 'Content' || n.name === 'Content Area';
          });
          break;
        }
        p = p.parent;
      }
    }
    if (!slot) slot = instance;
    for (var k = 0; k < spec.children.length; k++) {
      var child = await buildNode(spec.children[k], ctx);
      slot.appendChild(child);
      applySizing(child, spec.children[k].sizing);
    }
  }

  // Styles and variables
  await applyStyles(instance, spec.styles, ctx);
  applyVariables(instance, spec.variables, ctx);

  return instance;
}

/** Build a DIVIDER — shorthand for a divider component instance */
async function buildDivider(spec, ctx) {
  var divRef = ctx.imports['divider'] || ctx.imports['cardDivider'];
  if (!divRef) {
    // Fallback: create a thin rectangle as divider
    var line = figma.createRectangle();
    line.name = spec.name || 'Divider';
    line.resize(spec.width || 300, 1);
    line.fills = [{ type: 'SOLID', color: hexToRgb(spec.color || '#E0E0E0') }];
    return line;
  }
  var instance = divRef.type === 'COMPONENT_SET'
    ? (divRef.defaultVariant || divRef.children[0]).createInstance()
    : divRef.createInstance();
  if (spec.name) instance.name = spec.name;
  return instance;
}

/** Build a LOCAL_INSTANCE — instance of a component in the same file, referenced by node ID.
 *  spec.ref → key in ctx.localComponents (resolved from spec.localComponents at startup)
 *  spec.variant → variant name to find in the component set's children */
async function buildLocalInstance(spec, ctx) {
  var compOrSet = ctx.localComponents[spec.ref];
  if (!compOrSet) throw new Error('Local component ref not found: ' + spec.ref + '. Add it to spec.localComponents.');

  var instance;
  if (spec.variant && compOrSet.type === 'COMPONENT_SET') {
    var variants = compOrSet.children;
    var target = null;
    for (var i = 0; i < variants.length; i++) {
      if (variants[i].name === spec.variant) { target = variants[i]; break; }
    }
    if (!target) {
      // Partial match fallback
      for (var j = 0; j < variants.length; j++) {
        if (variants[j].name.indexOf(spec.variant) !== -1) { target = variants[j]; break; }
      }
    }
    if (target) {
      instance = target.createInstance();
    } else {
      instance = compOrSet.defaultVariant
        ? compOrSet.defaultVariant.createInstance()
        : variants[0].createInstance();
    }
  } else if (compOrSet.type === 'COMPONENT_SET') {
    instance = compOrSet.defaultVariant
      ? compOrSet.defaultVariant.createInstance()
      : compOrSet.children[0].createInstance();
  } else {
    instance = compOrSet.createInstance();
  }

  if (spec.name) instance.name = spec.name;
  applyOpacity(instance, spec.opacity);
  return instance;
}

// ─── Tier 2 Builders ──────────────────────────────────────────────────────────

/** Build a LINE node */
async function buildLine(spec, ctx) {
  var line = figma.createLine();
  if (spec.name) line.name = spec.name;
  if (spec.length !== undefined) line.resize(spec.length, 0);
  if (spec.stroke) {
    if (spec.stroke.color) {
      line.strokes = [{ type: 'SOLID', color: hexToRgb(spec.stroke.color) }];
    }
    if (spec.stroke.weight !== undefined) line.strokeWeight = spec.stroke.weight;
  }
  if (spec.rotation !== undefined) line.rotation = spec.rotation;
  applyOpacity(line, spec.opacity);
  return line;
}

/** Build an ELLIPSE node */
async function buildEllipse(spec, ctx) {
  var ellipse = figma.createEllipse();
  if (spec.name) ellipse.name = spec.name;
  if (spec.width !== undefined && spec.height !== undefined) {
    ellipse.resize(spec.width, spec.height);
  }
  applyFills(ellipse, spec.fills);
  applyStroke(ellipse, spec.stroke);
  if (spec.arcData) {
    ellipse.arcData = {
      startingAngle: spec.arcData.startingAngle || 0,
      endingAngle: spec.arcData.endingAngle || 6.2832,
      innerRadius: spec.arcData.innerRadius || 0
    };
  }
  applyOpacity(ellipse, spec.opacity);
  return ellipse;
}

/** Build a VECTOR node from path data */
async function buildVector(spec, ctx) {
  var vector = figma.createVector();
  if (spec.name) vector.name = spec.name;
  if (spec.paths) {
    vector.vectorPaths = spec.paths.map(function (p) {
      if (typeof p === 'string') {
        return { windingRule: 'NONZERO', data: p };
      }
      return { windingRule: p.windingRule || 'NONZERO', data: p.data };
    });
  }
  if (spec.width !== undefined && spec.height !== undefined) {
    vector.resize(spec.width, spec.height);
  }
  applyFills(vector, spec.fills);
  applyStroke(vector, spec.stroke);
  applyOpacity(vector, spec.opacity);
  return vector;
}

/** Build a POLYGON node */
async function buildPolygon(spec, ctx) {
  var polygon = figma.createPolygon();
  if (spec.name) polygon.name = spec.name;
  if (spec.width !== undefined && spec.height !== undefined) {
    polygon.resize(spec.width, spec.height);
  }
  if (spec.pointCount !== undefined) polygon.pointCount = spec.pointCount;
  applyFills(polygon, spec.fills);
  applyStroke(polygon, spec.stroke);
  applyOpacity(polygon, spec.opacity);
  return polygon;
}

/** Build a STAR node */
async function buildStar(spec, ctx) {
  var star = figma.createStar();
  if (spec.name) star.name = spec.name;
  if (spec.width !== undefined && spec.height !== undefined) {
    star.resize(spec.width, spec.height);
  }
  if (spec.pointCount !== undefined) star.pointCount = spec.pointCount;
  if (spec.innerRadius !== undefined) star.innerRadius = spec.innerRadius;
  applyFills(star, spec.fills);
  applyStroke(star, spec.stroke);
  applyOpacity(star, spec.opacity);
  return star;
}

/** Build a node from raw SVG string */
async function buildSvg(spec, ctx) {
  var node = figma.createNodeFromSvg(spec.svg);
  if (spec.name) node.name = spec.name;
  return node;
}

// ─── Tier 3 Builders ──────────────────────────────────────────────────────────

/** Build a GROUP node — children must exist on the page before grouping */
async function buildGroup(spec, ctx) {
  var children = [];
  for (var i = 0; i < (spec.children || []).length; i++) {
    var child = await buildNode(spec.children[i], ctx);
    figma.currentPage.appendChild(child);
    children.push(child);
  }
  if (children.length === 0) {
    throw new Error('GROUP requires at least one child');
  }
  var group = figma.group(children, figma.currentPage);
  if (spec.name) group.name = spec.name;
  applyOpacity(group, spec.opacity);
  return group;
}

/** Build a BOOLEAN operation node (union, subtract, intersect, exclude) */
async function buildBoolean(spec, ctx) {
  var children = [];
  for (var i = 0; i < (spec.children || []).length; i++) {
    var child = await buildNode(spec.children[i], ctx);
    figma.currentPage.appendChild(child);
    children.push(child);
  }
  if (children.length < 2) {
    throw new Error('BOOLEAN requires at least two children');
  }

  var boolNode;
  var op = (spec.operation || 'UNION').toUpperCase();
  switch (op) {
    case 'UNION':     boolNode = figma.union(children, figma.currentPage); break;
    case 'SUBTRACT':  boolNode = figma.subtract(children, figma.currentPage); break;
    case 'INTERSECT': boolNode = figma.intersect(children, figma.currentPage); break;
    case 'EXCLUDE':   boolNode = figma.exclude(children, figma.currentPage); break;
    default: throw new Error('Unknown boolean operation: ' + op);
  }

  if (spec.name) boolNode.name = spec.name;
  applyFills(boolNode, spec.fills);
  applyStroke(boolNode, spec.stroke);
  applyOpacity(boolNode, spec.opacity);
  return boolNode;
}

/** Build a SECTION node */
async function buildSection(spec, ctx) {
  var section = figma.createSection();
  if (spec.name) section.name = spec.name;
  applyFills(section, spec.fills);

  if (spec.children) {
    for (var i = 0; i < spec.children.length; i++) {
      var child = await buildNode(spec.children[i], ctx);
      section.appendChild(child);
    }
  }
  return section;
}

// ─── Tier 4 Builders — Component Authoring ───────────────────────────────────

/**
 * Build a COMPONENT node (single reusable component).
 * Properties: [{ name, type: "TEXT"|"BOOLEAN"|"INSTANCE_SWAP"|"VARIANT", default }]
 * After children are built, text nodes are linked to TEXT properties via componentPropertyReferences.
 */
async function buildComponent(spec, ctx) {
  var comp = figma.createComponent();
  if (spec.name) comp.name = spec.name;

  applyLayout(comp, spec.layout);
  applyFills(comp, spec.fills);
  applyCornerRadius(comp, spec.cornerRadius);
  applyStroke(comp, spec.stroke);
  applyEffects(comp, spec.effects);
  applyOpacity(comp, spec.opacity);

  if (spec.width != null && spec.height != null) comp.resize(spec.width, spec.height);

  // Add component properties BEFORE children (so children can reference them)
  var propKeys = {}; // name → actual key (includes internal ID suffix)
  if (spec.properties) {
    for (var i = 0; i < spec.properties.length; i++) {
      var p = spec.properties[i];
      var propType = p.type || 'TEXT';
      var defaultVal = p.default;
      if (propType === 'TEXT') defaultVal = defaultVal || '';
      else if (propType === 'BOOLEAN') defaultVal = defaultVal !== false;

      comp.addComponentProperty(p.name, propType, defaultVal);

      // Find the actual key (Figma appends #id:n suffix)
      var keys = Object.keys(comp.componentPropertyDefinitions);
      for (var k = 0; k < keys.length; k++) {
        if (keys[k].split('#')[0] === p.name) { propKeys[p.name] = keys[k]; break; }
      }
    }
  }

  // Build children
  if (spec.children) {
    for (var j = 0; j < spec.children.length; j++) {
      var child = await buildNode(spec.children[j], ctx);
      comp.appendChild(child);
      applySizing(child, spec.children[j].sizing);
    }
  }

  // Link text nodes to TEXT properties via componentPropertyReferences
  // This prevents "unused property" errors when publishing
  if (spec.propertyLinks) {
    for (var link = 0; link < spec.propertyLinks.length; link++) {
      var pl = spec.propertyLinks[link];
      var textNode = comp.findOne(function (n) { return n.type === 'TEXT' && n.name === pl.layer; });
      if (textNode && propKeys[pl.property]) {
        textNode.componentPropertyReferences = { characters: propKeys[pl.property] };
      }
    }
  }

  // Variable scopes — set on bound variables after binding
  if (spec.variableScopes) {
    for (var vs = 0; vs < spec.variableScopes.length; vs++) {
      var scope = spec.variableScopes[vs];
      var variable = ctx.variables[scope.ref];
      if (variable) variable.scopes = scope.scopes;
    }
  }

  await applyStyles(comp, spec.styles, ctx);
  applyVariables(comp, spec.variables, ctx);

  return comp;
}

/**
 * Build a COMPONENT_SET (variant group).
 * spec.variants: array of COMPONENT specs, each with a name like "Type=Success, Size=Large"
 * The interpreter builds each variant as a Component, then combines them.
 */
async function buildComponentSet(spec, ctx) {
  var components = [];
  for (var i = 0; i < (spec.variants || []).length; i++) {
    var variantSpec = spec.variants[i];
    variantSpec.type = 'COMPONENT'; // ensure type
    var comp = await buildComponent(variantSpec, ctx);
    figma.currentPage.appendChild(comp);
    components.push(comp);
  }

  if (components.length === 0) throw new Error('COMPONENT_SET requires at least one variant');

  var set = figma.combineAsVariants(components, figma.currentPage);
  if (spec.name) set.name = spec.name;
  if (spec.description) set.description = spec.description;

  return set;
}
