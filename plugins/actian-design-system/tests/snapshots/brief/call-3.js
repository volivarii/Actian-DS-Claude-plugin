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
c0.name = 'Anatomy';
c0.resize(1200, c0.height);
setProp(c0, 'Title', 'Anatomy');
setProp(c0, 'Subtitle', 'Component structure, dimensions, interactive states, and part-level token mapping');
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
}
var c1 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });
c1.fontName = { family: 'Inter', style: 'Semi Bold' };
c1.fontSize = 16;
c1.characters = 'Structure';
c1.fills = [{ type: 'SOLID', color: hexToRgb('#1A1A2E') }];
c0_slot.appendChild(c1);
var c2 = figma.createFrame();
c2.name = 'Structure diagram';
c2.primaryAxisSizingMode = 'AUTO';
c2.counterAxisSizingMode = 'AUTO';
c2.fills = [{ type: 'SOLID', color: hexToRgb('#F9FAFB') }];
c2.cornerRadius = 12;
var c3;
(function() {
  var _cs = _imp_pointerBadge;
  if (_cs.type === 'COMPONENT_SET') {
    var _variants = _cs.children;
    var _target = null;
    for (var _i = 0; _i < _variants.length; _i++) {
      if (_variants[_i].name === 'Direction=Left') { _target = _variants[_i]; break; }
    }
    if (!_target) {
      for (var _j = 0; _j < _variants.length; _j++) {
        if (_variants[_j].name.indexOf('Direction=Left') !== -1) { _target = _variants[_j]; break; }
      }
    }
    if (_target) {
      c3 = _target.createInstance();
    } else {
      c3 = (_cs.defaultVariant || _cs.children[0]).createInstance();
    }
  } else {
    c3 = _cs.createInstance();
  }
})();
c3.name = 'Badge A';
setProp(c3, 'Label', 'A');
c2.appendChild(c3);
c3.layoutSizingHorizontal = 'HUG';
c3.layoutSizingVertical = 'HUG';
var c4 = figma.createRectangle();
c4.name = 'Leader A';
c4.resize(16, 16);
c4.fills = [];
c2.appendChild(c4);
var c5;
(function() {
  var _cs = _imp_pointerBadge;
  if (_cs.type === 'COMPONENT_SET') {
    var _variants = _cs.children;
    var _target = null;
    for (var _i = 0; _i < _variants.length; _i++) {
      if (_variants[_i].name === 'Direction=Left') { _target = _variants[_i]; break; }
    }
    if (!_target) {
      for (var _j = 0; _j < _variants.length; _j++) {
        if (_variants[_j].name.indexOf('Direction=Left') !== -1) { _target = _variants[_j]; break; }
      }
    }
    if (_target) {
      c5 = _target.createInstance();
    } else {
      c5 = (_cs.defaultVariant || _cs.children[0]).createInstance();
    }
  } else {
    c5 = _cs.createInstance();
  }
})();
c5.name = 'Badge B';
setProp(c5, 'Label', 'B');
c2.appendChild(c5);
c5.layoutSizingHorizontal = 'HUG';
c5.layoutSizingVertical = 'HUG';
var c6 = figma.createRectangle();
c6.name = 'Leader B';
c6.resize(16, 16);
c6.fills = [];
c2.appendChild(c6);
var c7;
(function() {
  var _cs = _imp_pointerBadge;
  if (_cs.type === 'COMPONENT_SET') {
    var _variants = _cs.children;
    var _target = null;
    for (var _i = 0; _i < _variants.length; _i++) {
      if (_variants[_i].name === 'Direction=Left') { _target = _variants[_i]; break; }
    }
    if (!_target) {
      for (var _j = 0; _j < _variants.length; _j++) {
        if (_variants[_j].name.indexOf('Direction=Left') !== -1) { _target = _variants[_j]; break; }
      }
    }
    if (_target) {
      c7 = _target.createInstance();
    } else {
      c7 = (_cs.defaultVariant || _cs.children[0]).createInstance();
    }
  } else {
    c7 = _cs.createInstance();
  }
})();
c7.name = 'Badge C';
setProp(c7, 'Label', 'C');
c2.appendChild(c7);
c7.layoutSizingHorizontal = 'HUG';
c7.layoutSizingVertical = 'HUG';
var c8 = figma.createRectangle();
c8.name = 'Leader C';
c8.resize(16, 16);
c8.fills = [];
c2.appendChild(c8);
var c9;
(function() {
  var _cs = _imp_pointerBadge;
  if (_cs.type === 'COMPONENT_SET') {
    var _variants = _cs.children;
    var _target = null;
    for (var _i = 0; _i < _variants.length; _i++) {
      if (_variants[_i].name === 'Direction=Left') { _target = _variants[_i]; break; }
    }
    if (!_target) {
      for (var _j = 0; _j < _variants.length; _j++) {
        if (_variants[_j].name.indexOf('Direction=Left') !== -1) { _target = _variants[_j]; break; }
      }
    }
    if (_target) {
      c9 = _target.createInstance();
    } else {
      c9 = (_cs.defaultVariant || _cs.children[0]).createInstance();
    }
  } else {
    c9 = _cs.createInstance();
  }
})();
c9.name = 'Badge D';
setProp(c9, 'Label', 'D');
c2.appendChild(c9);
c9.layoutSizingHorizontal = 'HUG';
c9.layoutSizingVertical = 'HUG';
var c10 = figma.createRectangle();
c10.name = 'Leader D';
c10.resize(16, 16);
c10.fills = [];
c2.appendChild(c10);
c0_slot.appendChild(c2);
_fillH(c2);
c2.layoutSizingVertical = 'FIXED';
c2.resize(c2.width, 400);
var c11 = figma.createFrame();
c11.name = 'Legend';
c11.layoutMode = 'HORIZONTAL';
c11.itemSpacing = 20;
c11.paddingTop = 0;
c11.paddingRight = 0;
c11.paddingBottom = 0;
c11.paddingLeft = 0;
c11.primaryAxisSizingMode = 'AUTO';
c11.counterAxisSizingMode = 'AUTO';
c11.fills = [];
var c12 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
c12.fontName = { family: 'Inter', style: 'Regular' };
c12.fontSize = 12;
c12.characters = 'A — Link text';
c12.fills = [{ type: 'SOLID', color: hexToRgb('#595968') }];
c11.appendChild(c12);
var c13 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
c13.fontName = { family: 'Inter', style: 'Regular' };
c13.fontSize = 12;
c13.characters = 'B — Trailing icon';
c13.fills = [{ type: 'SOLID', color: hexToRgb('#595968') }];
c11.appendChild(c13);
var c14 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
c14.fontName = { family: 'Inter', style: 'Regular' };
c14.fontSize = 12;
c14.characters = 'C — Focus ring';
c14.fills = [{ type: 'SOLID', color: hexToRgb('#595968') }];
c11.appendChild(c14);
var c15 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
c15.fontName = { family: 'Inter', style: 'Regular' };
c15.fontSize = 12;
c15.characters = 'D — Underline';
c15.fills = [{ type: 'SOLID', color: hexToRgb('#595968') }];
c11.appendChild(c15);
c0_slot.appendChild(c11);
_fillH(c11);
c11.layoutSizingVertical = 'HUG';
var c16 = figma.createRectangle();
c16.name = 'Divider';
c16.resize(300, 1);
c16.fills = [{ type: 'SOLID', color: hexToRgb('#E0E0E0') }];
c0_slot.appendChild(c16);
var c17 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });
c17.fontName = { family: 'Inter', style: 'Semi Bold' };
c17.fontSize = 16;
c17.characters = 'Specs';
c17.fills = [{ type: 'SOLID', color: hexToRgb('#1A1A2E') }];
c0_slot.appendChild(c17);
var c18 = figma.createFrame();
c18.name = 'Specs diagram';
c18.primaryAxisSizingMode = 'AUTO';
c18.counterAxisSizingMode = 'AUTO';
c18.fills = [{ type: 'SOLID', color: hexToRgb('#F9FAFB') }];
c18.cornerRadius = 12;
var c19;
(function() {
  var _cs = _imp_dimAnnotation;
  if (_cs.type === 'COMPONENT_SET') {
    var _variants = _cs.children;
    var _target = null;
    for (var _i = 0; _i < _variants.length; _i++) {
      if (_variants[_i].name === 'Orientation=Horizontal') { _target = _variants[_i]; break; }
    }
    if (!_target) {
      for (var _j = 0; _j < _variants.length; _j++) {
        if (_variants[_j].name.indexOf('Orientation=Horizontal') !== -1) { _target = _variants[_j]; break; }
      }
    }
    if (_target) {
      c19 = _target.createInstance();
    } else {
      c19 = (_cs.defaultVariant || _cs.children[0]).createInstance();
    }
  } else {
    c19 = _cs.createInstance();
  }
})();
c19.name = 'Spec: text-to-icon gap';
setProp(c19, 'Value', '4px');
c18.appendChild(c19);
c19.layoutSizingHorizontal = 'HUG';
c19.layoutSizingVertical = 'HUG';
var c20;
(function() {
  var _cs = _imp_dimAnnotation;
  if (_cs.type === 'COMPONENT_SET') {
    var _variants = _cs.children;
    var _target = null;
    for (var _i = 0; _i < _variants.length; _i++) {
      if (_variants[_i].name === 'Orientation=Vertical') { _target = _variants[_i]; break; }
    }
    if (!_target) {
      for (var _j = 0; _j < _variants.length; _j++) {
        if (_variants[_j].name.indexOf('Orientation=Vertical') !== -1) { _target = _variants[_j]; break; }
      }
    }
    if (_target) {
      c20 = _target.createInstance();
    } else {
      c20 = (_cs.defaultVariant || _cs.children[0]).createInstance();
    }
  } else {
    c20 = _cs.createInstance();
  }
})();
c20.name = 'Spec: focus ring offset';
setProp(c20, 'Value', '2px');
c18.appendChild(c20);
c20.layoutSizingHorizontal = 'HUG';
c20.layoutSizingVertical = 'HUG';
var c21;
(function() {
  var _cs = _imp_dimAnnotation;
  if (_cs.type === 'COMPONENT_SET') {
    var _variants = _cs.children;
    var _target = null;
    for (var _i = 0; _i < _variants.length; _i++) {
      if (_variants[_i].name === 'Orientation=Vertical') { _target = _variants[_i]; break; }
    }
    if (!_target) {
      for (var _j = 0; _j < _variants.length; _j++) {
        if (_variants[_j].name.indexOf('Orientation=Vertical') !== -1) { _target = _variants[_j]; break; }
      }
    }
    if (_target) {
      c21 = _target.createInstance();
    } else {
      c21 = (_cs.defaultVariant || _cs.children[0]).createInstance();
    }
  } else {
    c21 = _cs.createInstance();
  }
})();
c21.name = 'Spec: icon size';
setProp(c21, 'Value', '16px');
c18.appendChild(c21);
c21.layoutSizingHorizontal = 'HUG';
c21.layoutSizingVertical = 'HUG';
c0_slot.appendChild(c18);
_fillH(c18);
c18.layoutSizingVertical = 'FIXED';
c18.resize(c18.width, 300);
var c22 = figma.createRectangle();
c22.name = 'Divider';
c22.resize(300, 1);
c22.fills = [{ type: 'SOLID', color: hexToRgb('#E0E0E0') }];
c0_slot.appendChild(c22);
var c23 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });
c23.fontName = { family: 'Inter', style: 'Semi Bold' };
c23.fontSize = 16;
c23.characters = 'States';
c23.fills = [{ type: 'SOLID', color: hexToRgb('#1A1A2E') }];
c0_slot.appendChild(c23);
var c24 = figma.createFrame();
c24.name = 'States grid';
c24.layoutMode = 'HORIZONTAL';
c24.itemSpacing = 24;
c24.paddingTop = 0;
c24.paddingRight = 0;
c24.paddingBottom = 0;
c24.paddingLeft = 0;
c24.primaryAxisSizingMode = 'AUTO';
c24.counterAxisSizingMode = 'AUTO';
c24.fills = [];
var c25 = figma.createFrame();
c25.name = 'State: Enabled';
c25.layoutMode = 'VERTICAL';
c25.itemSpacing = 8;
c25.paddingTop = 0;
c25.paddingRight = 0;
c25.paddingBottom = 0;
c25.paddingLeft = 0;
c25.primaryAxisSizingMode = 'AUTO';
c25.counterAxisSizingMode = 'AUTO';
c25.fills = [];
var c26 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });
c26.fontName = { family: 'Inter', style: 'Medium' };
c26.fontSize = 12;
c26.characters = 'Enabled';
c26.fills = [{ type: 'SOLID', color: hexToRgb('#888888') }];
c25.appendChild(c26);
var c27;
(function() {
  var _cs = _local_targetComponent;
  if (_cs && _cs.type === 'COMPONENT_SET') {
    var _variants = _cs.children;
    var _target = null;
    for (var _i = 0; _i < _variants.length; _i++) {
      if (_variants[_i].name === 'State=Enabled') { _target = _variants[_i]; break; }
    }
    if (!_target) {
      for (var _j = 0; _j < _variants.length; _j++) {
        if (_variants[_j].name.indexOf('State=Enabled') !== -1) { _target = _variants[_j]; break; }
      }
    }
    if (_target) {
      c27 = _target.createInstance();
    } else {
      c27 = (_cs.defaultVariant || _cs.children[0]).createInstance();
    }
  } else if (_cs) {
    c27 = _cs.createInstance();
  } else {
    c27 = figma.createFrame();
    c27.name = 'Missing: targetComponent';
  }
})();
c27.name = 'Enabled state';
c25.appendChild(c27);
c24.appendChild(c25);
c25.layoutSizingHorizontal = 'HUG';
c25.layoutSizingVertical = 'HUG';
var c28 = figma.createFrame();
c28.name = 'State: Hovered';
c28.layoutMode = 'VERTICAL';
c28.itemSpacing = 8;
c28.paddingTop = 0;
c28.paddingRight = 0;
c28.paddingBottom = 0;
c28.paddingLeft = 0;
c28.primaryAxisSizingMode = 'AUTO';
c28.counterAxisSizingMode = 'AUTO';
c28.fills = [];
var c29 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });
c29.fontName = { family: 'Inter', style: 'Medium' };
c29.fontSize = 12;
c29.characters = 'Hovered';
c29.fills = [{ type: 'SOLID', color: hexToRgb('#888888') }];
c28.appendChild(c29);
var c30;
(function() {
  var _cs = _local_targetComponent;
  if (_cs && _cs.type === 'COMPONENT_SET') {
    var _variants = _cs.children;
    var _target = null;
    for (var _i = 0; _i < _variants.length; _i++) {
      if (_variants[_i].name === 'State=Hovered') { _target = _variants[_i]; break; }
    }
    if (!_target) {
      for (var _j = 0; _j < _variants.length; _j++) {
        if (_variants[_j].name.indexOf('State=Hovered') !== -1) { _target = _variants[_j]; break; }
      }
    }
    if (_target) {
      c30 = _target.createInstance();
    } else {
      c30 = (_cs.defaultVariant || _cs.children[0]).createInstance();
    }
  } else if (_cs) {
    c30 = _cs.createInstance();
  } else {
    c30 = figma.createFrame();
    c30.name = 'Missing: targetComponent';
  }
})();
c30.name = 'Hovered state';
c28.appendChild(c30);
c24.appendChild(c28);
c28.layoutSizingHorizontal = 'HUG';
c28.layoutSizingVertical = 'HUG';
var c31 = figma.createFrame();
c31.name = 'State: Focused';
c31.layoutMode = 'VERTICAL';
c31.itemSpacing = 8;
c31.paddingTop = 0;
c31.paddingRight = 0;
c31.paddingBottom = 0;
c31.paddingLeft = 0;
c31.primaryAxisSizingMode = 'AUTO';
c31.counterAxisSizingMode = 'AUTO';
c31.fills = [];
var c32 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });
c32.fontName = { family: 'Inter', style: 'Medium' };
c32.fontSize = 12;
c32.characters = 'Focused';
c32.fills = [{ type: 'SOLID', color: hexToRgb('#888888') }];
c31.appendChild(c32);
var c33;
(function() {
  var _cs = _local_targetComponent;
  if (_cs && _cs.type === 'COMPONENT_SET') {
    var _variants = _cs.children;
    var _target = null;
    for (var _i = 0; _i < _variants.length; _i++) {
      if (_variants[_i].name === 'State=Focused') { _target = _variants[_i]; break; }
    }
    if (!_target) {
      for (var _j = 0; _j < _variants.length; _j++) {
        if (_variants[_j].name.indexOf('State=Focused') !== -1) { _target = _variants[_j]; break; }
      }
    }
    if (_target) {
      c33 = _target.createInstance();
    } else {
      c33 = (_cs.defaultVariant || _cs.children[0]).createInstance();
    }
  } else if (_cs) {
    c33 = _cs.createInstance();
  } else {
    c33 = figma.createFrame();
    c33.name = 'Missing: targetComponent';
  }
})();
c33.name = 'Focused state';
c31.appendChild(c33);
c24.appendChild(c31);
c31.layoutSizingHorizontal = 'HUG';
c31.layoutSizingVertical = 'HUG';
var c34 = figma.createFrame();
c34.name = 'State: Pressed';
c34.layoutMode = 'VERTICAL';
c34.itemSpacing = 8;
c34.paddingTop = 0;
c34.paddingRight = 0;
c34.paddingBottom = 0;
c34.paddingLeft = 0;
c34.primaryAxisSizingMode = 'AUTO';
c34.counterAxisSizingMode = 'AUTO';
c34.fills = [];
var c35 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });
c35.fontName = { family: 'Inter', style: 'Medium' };
c35.fontSize = 12;
c35.characters = 'Pressed';
c35.fills = [{ type: 'SOLID', color: hexToRgb('#888888') }];
c34.appendChild(c35);
var c36;
(function() {
  var _cs = _local_targetComponent;
  if (_cs && _cs.type === 'COMPONENT_SET') {
    var _variants = _cs.children;
    var _target = null;
    for (var _i = 0; _i < _variants.length; _i++) {
      if (_variants[_i].name === 'State=Pressed') { _target = _variants[_i]; break; }
    }
    if (!_target) {
      for (var _j = 0; _j < _variants.length; _j++) {
        if (_variants[_j].name.indexOf('State=Pressed') !== -1) { _target = _variants[_j]; break; }
      }
    }
    if (_target) {
      c36 = _target.createInstance();
    } else {
      c36 = (_cs.defaultVariant || _cs.children[0]).createInstance();
    }
  } else if (_cs) {
    c36 = _cs.createInstance();
  } else {
    c36 = figma.createFrame();
    c36.name = 'Missing: targetComponent';
  }
})();
c36.name = 'Pressed state';
c34.appendChild(c36);
c24.appendChild(c34);
c34.layoutSizingHorizontal = 'HUG';
c34.layoutSizingVertical = 'HUG';
var c37 = figma.createFrame();
c37.name = 'State: Once clicked';
c37.layoutMode = 'VERTICAL';
c37.itemSpacing = 8;
c37.paddingTop = 0;
c37.paddingRight = 0;
c37.paddingBottom = 0;
c37.paddingLeft = 0;
c37.primaryAxisSizingMode = 'AUTO';
c37.counterAxisSizingMode = 'AUTO';
c37.fills = [];
var c38 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });
c38.fontName = { family: 'Inter', style: 'Medium' };
c38.fontSize = 12;
c38.characters = 'Once clicked';
c38.fills = [{ type: 'SOLID', color: hexToRgb('#888888') }];
c37.appendChild(c38);
var c39;
(function() {
  var _cs = _local_targetComponent;
  if (_cs && _cs.type === 'COMPONENT_SET') {
    var _variants = _cs.children;
    var _target = null;
    for (var _i = 0; _i < _variants.length; _i++) {
      if (_variants[_i].name === 'State=Once clicked') { _target = _variants[_i]; break; }
    }
    if (!_target) {
      for (var _j = 0; _j < _variants.length; _j++) {
        if (_variants[_j].name.indexOf('State=Once clicked') !== -1) { _target = _variants[_j]; break; }
      }
    }
    if (_target) {
      c39 = _target.createInstance();
    } else {
      c39 = (_cs.defaultVariant || _cs.children[0]).createInstance();
    }
  } else if (_cs) {
    c39 = _cs.createInstance();
  } else {
    c39 = figma.createFrame();
    c39.name = 'Missing: targetComponent';
  }
})();
c39.name = 'Once clicked state';
c37.appendChild(c39);
c24.appendChild(c37);
c37.layoutSizingHorizontal = 'HUG';
c37.layoutSizingVertical = 'HUG';
var c40 = figma.createFrame();
c40.name = 'State: Disabled';
c40.layoutMode = 'VERTICAL';
c40.itemSpacing = 8;
c40.paddingTop = 0;
c40.paddingRight = 0;
c40.paddingBottom = 0;
c40.paddingLeft = 0;
c40.primaryAxisSizingMode = 'AUTO';
c40.counterAxisSizingMode = 'AUTO';
c40.fills = [];
var c41 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });
c41.fontName = { family: 'Inter', style: 'Medium' };
c41.fontSize = 12;
c41.characters = 'Disabled';
c41.fills = [{ type: 'SOLID', color: hexToRgb('#888888') }];
c40.appendChild(c41);
var c42;
(function() {
  var _cs = _local_targetComponent;
  if (_cs && _cs.type === 'COMPONENT_SET') {
    var _variants = _cs.children;
    var _target = null;
    for (var _i = 0; _i < _variants.length; _i++) {
      if (_variants[_i].name === 'State=Disabled') { _target = _variants[_i]; break; }
    }
    if (!_target) {
      for (var _j = 0; _j < _variants.length; _j++) {
        if (_variants[_j].name.indexOf('State=Disabled') !== -1) { _target = _variants[_j]; break; }
      }
    }
    if (_target) {
      c42 = _target.createInstance();
    } else {
      c42 = (_cs.defaultVariant || _cs.children[0]).createInstance();
    }
  } else if (_cs) {
    c42 = _cs.createInstance();
  } else {
    c42 = figma.createFrame();
    c42.name = 'Missing: targetComponent';
  }
})();
c42.name = 'Disabled state';
c40.appendChild(c42);
c24.appendChild(c40);
c40.layoutSizingHorizontal = 'HUG';
c40.layoutSizingVertical = 'HUG';
c0_slot.appendChild(c24);
_fillH(c24);
c24.layoutSizingVertical = 'HUG';
var c43 = figma.createRectangle();
c43.name = 'Divider';
c43.resize(300, 1);
c43.fills = [{ type: 'SOLID', color: hexToRgb('#E0E0E0') }];
c0_slot.appendChild(c43);
var c44 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });
c44.fontName = { family: 'Inter', style: 'Semi Bold' };
c44.fontSize = 16;
c44.characters = 'Parts reference';
c44.fills = [{ type: 'SOLID', color: hexToRgb('#1A1A2E') }];
c0_slot.appendChild(c44);
var c45 = figma.createFrame();
c45.name = 'Parts reference table';
c45.layoutMode = 'VERTICAL';
c45.itemSpacing = 0;
c45.paddingTop = 0;
c45.paddingRight = 0;
c45.paddingBottom = 0;
c45.paddingLeft = 0;
c45.primaryAxisSizingMode = 'AUTO';
c45.counterAxisSizingMode = 'AUTO';
c45.fills = [];
var c46 = figma.createFrame();
c46.name = 'Header';
c46.layoutMode = 'HORIZONTAL';
c46.itemSpacing = 0;
c46.paddingTop = 8;
c46.paddingRight = 12;
c46.paddingBottom = 8;
c46.paddingLeft = 12;
c46.primaryAxisSizingMode = 'AUTO';
c46.counterAxisSizingMode = 'AUTO';
c46.fills = [{ type: 'SOLID', color: hexToRgb('#F5F5FA') }];
var c47 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
c47.fontName = { family: 'Inter', style: 'Bold' };
c47.fontSize = 12;
c47.characters = 'Part';
c47.fills = [{ type: 'SOLID', color: hexToRgb('#595968') }];
c47.resize(60, c47.height);
c47.textAutoResize = 'HEIGHT';
c46.appendChild(c47);
var c48 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
c48.fontName = { family: 'Inter', style: 'Bold' };
c48.fontSize = 12;
c48.characters = 'Element';
c48.fills = [{ type: 'SOLID', color: hexToRgb('#595968') }];
c48.resize(140, c48.height);
c48.textAutoResize = 'HEIGHT';
c46.appendChild(c48);
var c49 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
c49.fontName = { family: 'Inter', style: 'Bold' };
c49.fontSize = 12;
c49.characters = 'Token';
c49.fills = [{ type: 'SOLID', color: hexToRgb('#595968') }];
c49.resize(240, c49.height);
c49.textAutoResize = 'HEIGHT';
c46.appendChild(c49);
var c50 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
c50.fontName = { family: 'Inter', style: 'Bold' };
c50.fontSize = 12;
c50.characters = 'Notes';
c50.fills = [{ type: 'SOLID', color: hexToRgb('#595968') }];
c50.resize(300, c50.height);
c50.textAutoResize = 'HEIGHT';
c46.appendChild(c50);
c45.appendChild(c46);
_fillH(c46);
c46.layoutSizingVertical = 'HUG';
var c51 = figma.createFrame();
c51.name = 'Row 0';
c51.layoutMode = 'HORIZONTAL';
c51.itemSpacing = 0;
c51.paddingTop = 8;
c51.paddingRight = 12;
c51.paddingBottom = 8;
c51.paddingLeft = 12;
c51.primaryAxisSizingMode = 'AUTO';
c51.counterAxisSizingMode = 'AUTO';
c51.fills = [];
var c52 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
c52.fontName = { family: 'Inter', style: 'Regular' };
c52.fontSize = 14;
c52.characters = 'A';
c52.fills = [{ type: 'SOLID', color: hexToRgb('#1A1A2E') }];
c52.resize(60, c52.height);
c52.textAutoResize = 'HEIGHT';
c51.appendChild(c52);
var c53 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
c53.fontName = { family: 'Inter', style: 'Regular' };
c53.fontSize = 14;
c53.characters = 'Link text';
c53.fills = [{ type: 'SOLID', color: hexToRgb('#1A1A2E') }];
c53.resize(140, c53.height);
c53.textAutoResize = 'HEIGHT';
c51.appendChild(c53);
var c54 = figma.createText();
await figma.loadFontAsync({ family: 'Fira Code', style: 'Regular' });
c54.fontName = { family: 'Fira Code', style: 'Regular' };
c54.fontSize = 12;
c54.characters = '--zen-font-body-standard, theme-primary';
c54.fills = [{ type: 'SOLID', color: hexToRgb('#1A1A2E') }];
c54.resize(240, c54.height);
c54.textAutoResize = 'HEIGHT';
c51.appendChild(c54);
var c55 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
c55.fontName = { family: 'Inter', style: 'Regular' };
c55.fontSize = 14;
c55.characters = 'Roboto 400 14px/20px, inherits theme color';
c55.fills = [{ type: 'SOLID', color: hexToRgb('#595968') }];
c55.resize(300, c55.height);
c55.textAutoResize = 'HEIGHT';
c51.appendChild(c55);
c45.appendChild(c51);
_fillH(c51);
c51.layoutSizingVertical = 'HUG';
var c56 = figma.createFrame();
c56.name = 'Row 1';
c56.layoutMode = 'HORIZONTAL';
c56.itemSpacing = 0;
c56.paddingTop = 8;
c56.paddingRight = 12;
c56.paddingBottom = 8;
c56.paddingLeft = 12;
c56.primaryAxisSizingMode = 'AUTO';
c56.counterAxisSizingMode = 'AUTO';
c56.fills = [];
var c57 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
c57.fontName = { family: 'Inter', style: 'Regular' };
c57.fontSize = 14;
c57.characters = 'B';
c57.fills = [{ type: 'SOLID', color: hexToRgb('#1A1A2E') }];
c57.resize(60, c57.height);
c57.textAutoResize = 'HEIGHT';
c56.appendChild(c57);
var c58 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
c58.fontName = { family: 'Inter', style: 'Regular' };
c58.fontSize = 14;
c58.characters = 'Trailing icon';
c58.fills = [{ type: 'SOLID', color: hexToRgb('#1A1A2E') }];
c58.resize(140, c58.height);
c58.textAutoResize = 'HEIGHT';
c56.appendChild(c58);
var c59 = figma.createText();
await figma.loadFontAsync({ family: 'Fira Code', style: 'Regular' });
c59.fontName = { family: 'Fira Code', style: 'Regular' };
c59.fontSize = 12;
c59.characters = 'theme-primary';
c59.fills = [{ type: 'SOLID', color: hexToRgb('#1A1A2E') }];
c59.resize(240, c59.height);
c59.textAutoResize = 'HEIGHT';
c56.appendChild(c59);
var c60 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
c60.fontName = { family: 'Inter', style: 'Regular' };
c60.fontSize = 14;
c60.characters = '16×16px, same color as text';
c60.fills = [{ type: 'SOLID', color: hexToRgb('#595968') }];
c60.resize(300, c60.height);
c60.textAutoResize = 'HEIGHT';
c56.appendChild(c60);
c45.appendChild(c56);
_fillH(c56);
c56.layoutSizingVertical = 'HUG';
var c61 = figma.createFrame();
c61.name = 'Row 2';
c61.layoutMode = 'HORIZONTAL';
c61.itemSpacing = 0;
c61.paddingTop = 8;
c61.paddingRight = 12;
c61.paddingBottom = 8;
c61.paddingLeft = 12;
c61.primaryAxisSizingMode = 'AUTO';
c61.counterAxisSizingMode = 'AUTO';
c61.fills = [];
var c62 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
c62.fontName = { family: 'Inter', style: 'Regular' };
c62.fontSize = 14;
c62.characters = 'C';
c62.fills = [{ type: 'SOLID', color: hexToRgb('#1A1A2E') }];
c62.resize(60, c62.height);
c62.textAutoResize = 'HEIGHT';
c61.appendChild(c62);
var c63 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
c63.fontName = { family: 'Inter', style: 'Regular' };
c63.fontSize = 14;
c63.characters = 'Focus ring';
c63.fills = [{ type: 'SOLID', color: hexToRgb('#1A1A2E') }];
c63.resize(140, c63.height);
c63.textAutoResize = 'HEIGHT';
c61.appendChild(c63);
var c64 = figma.createText();
await figma.loadFontAsync({ family: 'Fira Code', style: 'Regular' });
c64.fontName = { family: 'Fira Code', style: 'Regular' };
c64.fontSize = 12;
c64.characters = 'theme-primary';
c64.fills = [{ type: 'SOLID', color: hexToRgb('#1A1A2E') }];
c64.resize(240, c64.height);
c64.textAutoResize = 'HEIGHT';
c61.appendChild(c64);
var c65 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
c65.fontName = { family: 'Inter', style: 'Regular' };
c65.fontSize = 14;
c65.characters = '2px solid, 2px offset, rounded';
c65.fills = [{ type: 'SOLID', color: hexToRgb('#595968') }];
c65.resize(300, c65.height);
c65.textAutoResize = 'HEIGHT';
c61.appendChild(c65);
c45.appendChild(c61);
_fillH(c61);
c61.layoutSizingVertical = 'HUG';
var c66 = figma.createFrame();
c66.name = 'Row 3';
c66.layoutMode = 'HORIZONTAL';
c66.itemSpacing = 0;
c66.paddingTop = 8;
c66.paddingRight = 12;
c66.paddingBottom = 8;
c66.paddingLeft = 12;
c66.primaryAxisSizingMode = 'AUTO';
c66.counterAxisSizingMode = 'AUTO';
c66.fills = [];
var c67 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
c67.fontName = { family: 'Inter', style: 'Regular' };
c67.fontSize = 14;
c67.characters = 'D';
c67.fills = [{ type: 'SOLID', color: hexToRgb('#1A1A2E') }];
c67.resize(60, c67.height);
c67.textAutoResize = 'HEIGHT';
c66.appendChild(c67);
var c68 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
c68.fontName = { family: 'Inter', style: 'Regular' };
c68.fontSize = 14;
c68.characters = 'Underline';
c68.fills = [{ type: 'SOLID', color: hexToRgb('#1A1A2E') }];
c68.resize(140, c68.height);
c68.textAutoResize = 'HEIGHT';
c66.appendChild(c68);
var c69 = figma.createText();
await figma.loadFontAsync({ family: 'Fira Code', style: 'Regular' });
c69.fontName = { family: 'Fira Code', style: 'Regular' };
c69.fontSize = 12;
c69.characters = 'theme-primary';
c69.fills = [{ type: 'SOLID', color: hexToRgb('#1A1A2E') }];
c69.resize(240, c69.height);
c69.textAutoResize = 'HEIGHT';
c66.appendChild(c69);
var c70 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
c70.fontName = { family: 'Inter', style: 'Regular' };
c70.fontSize = 14;
c70.characters = 'Appears on hover and focus states';
c70.fills = [{ type: 'SOLID', color: hexToRgb('#595968') }];
c70.resize(300, c70.height);
c70.textAutoResize = 'HEIGHT';
c66.appendChild(c70);
c45.appendChild(c66);
_fillH(c66);
c66.layoutSizingVertical = 'HUG';
c0_slot.appendChild(c45);
_fillH(c45);
c45.layoutSizingVertical = 'HUG';
_wrapper.appendChild(c0);
_nodeCount++;

// Tag with plugin data
_wrapper.setSharedPluginData('actian_ds', 'skill', 'component-brief');
_wrapper.setSharedPluginData('actian_ds', 'pushed_at', new Date().toISOString());

// Return metadata
return { wrapperId: _wrapper.id, nodeCount: _nodeCount };