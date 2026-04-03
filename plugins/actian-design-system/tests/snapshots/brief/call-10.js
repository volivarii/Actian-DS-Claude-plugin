function hexToRgb(hex) {
  var h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16) / 255,
    g: parseInt(h.substring(2, 4), 16) / 255,
    b: parseInt(h.substring(4, 6), 16) / 255
  };
}

function angleToTransform(angleDeg) {
  var rad = (angleDeg * Math.PI) / 180;
  var cos = Math.cos(rad);
  var sin = Math.sin(rad);
  return [
    [cos, sin, 0.5 - 0.5 * cos - 0.5 * sin],
    [-sin, cos, 0.5 + 0.5 * sin - 0.5 * cos]
  ];
}

function setProp(instance, prefix, value) {
  var props = instance.componentProperties;
  for (var key in props) {
    var propName = key.split('#')[0];
    if (propName === prefix) {
      instance.setProperties({ [key]: value });
      return;
    }
  }
}

function _fillH(n) {
  var p = n.parent; if (!p) return;
  if (p.layoutMode && p.layoutMode !== 'NONE') { n.layoutSizingHorizontal = 'FILL'; }
  else { n.resize(Math.max((p.width||0)-(p.paddingLeft||0)-(p.paddingRight||0),1), n.height); }
}
function _fillV(n) {
  var p = n.parent; if (!p) return;
  if (p.layoutMode && p.layoutMode !== 'NONE') { n.layoutSizingVertical = 'FILL'; }
  else { n.resize(n.width, Math.max((p.height||0)-(p.paddingTop||0)-(p.paddingBottom||0),1)); }
}


// Navigate to target page
var _targetNode = await figma.getNodeByIdAsync(undefined);
var _page = _targetNode;
while (_page && _page.type !== 'PAGE') _page = _page.parent;
if (_page) await figma.setCurrentPageAsync(_page);

// Load fonts
await Promise.all([
  figma.loadFontAsync({ family: 'Inter', style: 'Regular' }),
  figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' }),
  figma.loadFontAsync({ family: 'Inter', style: 'Bold' }),
  figma.loadFontAsync({ family: 'Inter', style: 'Medium' }),
  figma.loadFontAsync({ family: 'Fira Code', style: 'Regular' }),
  figma.loadFontAsync({ family: 'Roboto', style: 'Regular' }),
]);

// Import components
var _imp_genLog = await figma.importComponentByKeyAsync('a9653f30925367e96dea90093d750bfe70849571');
var _imp_divider = await figma.importComponentByKeyAsync('f4d778e1cf9bb61a33712c791486f54bb1c095b7');
var _imp_codeBlock = await figma.importComponentByKeyAsync('1bf10eee1751a46da5f90a9671be6c9abf0073b7');
var _imp_flowCoverCard = await figma.importComponentByKeyAsync('eaebde6bd07d2f19f3f9c00a9587240cb085a90d');
var _imp_researchFrame = await figma.importComponentByKeyAsync('e671618f2b4c6ea406a995fdc3012ac54eadfe56');
var _imp_feedback = await figma.importComponentSetByKeyAsync('d5cba21bc3dbf36578665bac89834fbe1ca29ed0');
var _imp_briefCard = await figma.importComponentSetByKeyAsync('3dbb732730af0754210cde7af35e5236a2502843');
var _imp_doDontPair = await figma.importComponentSetByKeyAsync('28edfacf13e50706586172bd48f8a3ad84d7c263');
var _imp_contrastBadge = await figma.importComponentSetByKeyAsync('941756541adc6ce21e32e848c2039c64fece0fcf');
var _imp_pointerBadge = await figma.importComponentSetByKeyAsync('7e066fc21d9a2bbbcd1149113787cf59140162d4');
var _imp_dimAnnotation = await figma.importComponentSetByKeyAsync('49bf6a1b210a403ba145a3fdee9b1994eb54069a');
var _imp_a11yCard = await figma.importComponentSetByKeyAsync('b4779a13f4097d682413a669eaaf9ead1b49f115');

// Load local components
var _local_targetComponent = await figma.importComponentSetByKeyAsync('675f7f8d0d57162e4cce51d26cbe39cf490e9b8d');

// Create or find wrapper
var _wrapper = await figma.getNodeByIdAsync('__WRAPPER_ID__');
if (!_wrapper) throw new Error('Wrapper __WRAPPER_ID__ not found');

// Build tree
var _nodeCount = 0;
var c0;
(function() {
  var _cs = _imp_briefCard;
  if (_cs.type === 'COMPONENT_SET') {
    var _variants = _cs.children;
    var _target = null;
    for (var _i = 0; _i < _variants.length; _i++) {
      if (_variants[_i].name === 'Mode=DS, Type=Standard') { _target = _variants[_i]; break; }
    }
    if (!_target) {
      for (var _j = 0; _j < _variants.length; _j++) {
        if (_variants[_j].name.indexOf('Mode=DS, Type=Standard') !== -1) { _target = _variants[_j]; break; }
      }
    }
    if (_target) {
      c0 = _target.createInstance();
    } else {
      c0 = (_cs.defaultVariant || _cs.children[0]).createInstance();
    }
  } else {
    c0 = _cs.createInstance();
  }
})();
c0.name = 'Code specification';
c0.resize(1200, c0.height);
setProp(c0, 'Title', 'Code specification');
setProp(c0, 'Subtitle', 'CSS custom properties for Link');
c0 = c0.detachInstance();
var c0_slot = c0.findOne(function(n) { return n.name === "Content"; }) || c0;
if (c0_slot !== c0) {
  while (c0_slot.children.length) c0_slot.children[0].remove();
}
if (c0_slot !== c0) {
  c0_slot.layoutMode = 'VERTICAL';
  c0_slot.itemSpacing = 16;
  c0_slot.paddingTop = 48;
  c0_slot.paddingRight = 80;
  c0_slot.paddingBottom = 48;
  c0_slot.paddingLeft = 80;
  c0_slot.primaryAxisSizingMode = 'AUTO';
  c0_slot.counterAxisSizingMode = 'AUTO';
  c0.primaryAxisSizingMode = 'AUTO';
}
var c1;
(function() {
  var _cs = _imp_codeBlock;
  if (_cs.type === 'COMPONENT_SET') {
    c1 = (_cs.defaultVariant || _cs.children[0]).createInstance();
  } else {
    c1 = _cs.createInstance();
  }
})();
c1.name = 'CSS Code Block';
setProp(c1, 'Show Header', true);
setProp(c1, 'Header Text', 'CSS');
c1 = c1.detachInstance();
var c1_slot = c1.findOne(function(n) { return n.name === "Content"; }) || c1;
if (c1_slot !== c1) {
  while (c1_slot.children.length) c1_slot.children[0].remove();
}
var c2 = figma.createText();
c2.name = 'Code';
await figma.loadFontAsync({ family: 'Fira Code', style: 'Regular' });
c2.fontName = { family: 'Fira Code', style: 'Regular' };
c2.fontSize = 12;
c2.characters = '.zen-link {
  color: var(--zen-theme-primary);
  text-decoration: underline;
  font: var(--zen-font-body-standard);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: var(--zen-spacing-2xs); /* 4px */
}

.zen-link:hover {
  color: var(--zen-theme-primary-hover);
  text-decoration: underline;
}

.zen-link:focus-visible {
  outline: 2px solid var(--zen-theme-primary);
  outline-offset: 2px;
  border-radius: var(--zen-radius-xs);
}

.zen-link--disabled {
  color: var(--zen-text-disabled);
  text-decoration: none;
  pointer-events: none;
}';
c2.fills = [{ type: 'SOLID', color: hexToRgb('#BABED8') }];
c1_slot.appendChild(c2);
c0_slot.appendChild(c1);
_fillH(c1);
c1.layoutSizingVertical = 'HUG';
_wrapper.appendChild(c0);
_nodeCount++;

// Tag with plugin data
_wrapper.setSharedPluginData('actian_ds', 'skill', 'component-brief');
_wrapper.setSharedPluginData('actian_ds', 'pushed_at', new Date().toISOString());

// Return metadata
return { wrapperId: _wrapper.id, nodeCount: _nodeCount };