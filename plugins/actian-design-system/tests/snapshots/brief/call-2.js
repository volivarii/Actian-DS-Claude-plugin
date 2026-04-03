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
c0.name = 'Actual component';
c0.resize(1200, c0.height);
setProp(c0, 'Title', 'Actual component');
setProp(c0, 'Subtitle', 'Live component across all states and theme modes');
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
var c1 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });
c1.fontName = { family: 'Inter', style: 'Semi Bold' };
c1.fontSize = 16;
c1.characters = 'Variant matrix';
c1.fills = [{ type: 'SOLID', color: hexToRgb('#1A1A2E') }];
c0_slot.appendChild(c1);
var c2 = figma.createFrame();
c2.name = 'Row: Link';
c2.layoutMode = 'HORIZONTAL';
c2.itemSpacing = 24;
c2.paddingTop = 0;
c2.paddingRight = 0;
c2.paddingBottom = 0;
c2.paddingLeft = 0;
c2.primaryAxisSizingMode = 'AUTO';
c2.counterAxisSizingMode = 'AUTO';
c2.fills = [];
var c3 = figma.createFrame();
c3.name = 'Enabled';
c3.layoutMode = 'VERTICAL';
c3.itemSpacing = 8;
c3.paddingTop = 0;
c3.paddingRight = 0;
c3.paddingBottom = 0;
c3.paddingLeft = 0;
c3.primaryAxisSizingMode = 'AUTO';
c3.counterAxisSizingMode = 'AUTO';
c3.fills = [];
var c4;
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
      c4 = _target.createInstance();
    } else {
      c4 = (_cs.defaultVariant || _cs.children[0]).createInstance();
    }
  } else if (_cs) {
    c4 = _cs.createInstance();
  } else {
    c4 = figma.createFrame();
    c4.name = 'Missing: targetComponent';
  }
})();
c4.name = 'Link Enabled';
c3.appendChild(c4);
var c5 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });
c5.fontName = { family: 'Inter', style: 'Medium' };
c5.fontSize = 12;
c5.characters = 'Enabled';
c5.fills = [{ type: 'SOLID', color: hexToRgb('#888888') }];
c3.appendChild(c5);
c2.appendChild(c3);
c3.layoutSizingHorizontal = 'HUG';
c3.layoutSizingVertical = 'HUG';
var c6 = figma.createFrame();
c6.name = 'Hovered';
c6.layoutMode = 'VERTICAL';
c6.itemSpacing = 8;
c6.paddingTop = 0;
c6.paddingRight = 0;
c6.paddingBottom = 0;
c6.paddingLeft = 0;
c6.primaryAxisSizingMode = 'AUTO';
c6.counterAxisSizingMode = 'AUTO';
c6.fills = [];
var c7;
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
      c7 = _target.createInstance();
    } else {
      c7 = (_cs.defaultVariant || _cs.children[0]).createInstance();
    }
  } else if (_cs) {
    c7 = _cs.createInstance();
  } else {
    c7 = figma.createFrame();
    c7.name = 'Missing: targetComponent';
  }
})();
c7.name = 'Link Hovered';
c6.appendChild(c7);
var c8 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });
c8.fontName = { family: 'Inter', style: 'Medium' };
c8.fontSize = 12;
c8.characters = 'Hovered';
c8.fills = [{ type: 'SOLID', color: hexToRgb('#888888') }];
c6.appendChild(c8);
c2.appendChild(c6);
c6.layoutSizingHorizontal = 'HUG';
c6.layoutSizingVertical = 'HUG';
var c9 = figma.createFrame();
c9.name = 'Focused';
c9.layoutMode = 'VERTICAL';
c9.itemSpacing = 8;
c9.paddingTop = 0;
c9.paddingRight = 0;
c9.paddingBottom = 0;
c9.paddingLeft = 0;
c9.primaryAxisSizingMode = 'AUTO';
c9.counterAxisSizingMode = 'AUTO';
c9.fills = [];
var c10;
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
      c10 = _target.createInstance();
    } else {
      c10 = (_cs.defaultVariant || _cs.children[0]).createInstance();
    }
  } else if (_cs) {
    c10 = _cs.createInstance();
  } else {
    c10 = figma.createFrame();
    c10.name = 'Missing: targetComponent';
  }
})();
c10.name = 'Link Focused';
c9.appendChild(c10);
var c11 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });
c11.fontName = { family: 'Inter', style: 'Medium' };
c11.fontSize = 12;
c11.characters = 'Focused';
c11.fills = [{ type: 'SOLID', color: hexToRgb('#888888') }];
c9.appendChild(c11);
c2.appendChild(c9);
c9.layoutSizingHorizontal = 'HUG';
c9.layoutSizingVertical = 'HUG';
var c12 = figma.createFrame();
c12.name = 'Pressed';
c12.layoutMode = 'VERTICAL';
c12.itemSpacing = 8;
c12.paddingTop = 0;
c12.paddingRight = 0;
c12.paddingBottom = 0;
c12.paddingLeft = 0;
c12.primaryAxisSizingMode = 'AUTO';
c12.counterAxisSizingMode = 'AUTO';
c12.fills = [];
var c13;
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
      c13 = _target.createInstance();
    } else {
      c13 = (_cs.defaultVariant || _cs.children[0]).createInstance();
    }
  } else if (_cs) {
    c13 = _cs.createInstance();
  } else {
    c13 = figma.createFrame();
    c13.name = 'Missing: targetComponent';
  }
})();
c13.name = 'Link Pressed';
c12.appendChild(c13);
var c14 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });
c14.fontName = { family: 'Inter', style: 'Medium' };
c14.fontSize = 12;
c14.characters = 'Pressed';
c14.fills = [{ type: 'SOLID', color: hexToRgb('#888888') }];
c12.appendChild(c14);
c2.appendChild(c12);
c12.layoutSizingHorizontal = 'HUG';
c12.layoutSizingVertical = 'HUG';
var c15 = figma.createFrame();
c15.name = 'Once clicked';
c15.layoutMode = 'VERTICAL';
c15.itemSpacing = 8;
c15.paddingTop = 0;
c15.paddingRight = 0;
c15.paddingBottom = 0;
c15.paddingLeft = 0;
c15.primaryAxisSizingMode = 'AUTO';
c15.counterAxisSizingMode = 'AUTO';
c15.fills = [];
var c16;
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
      c16 = _target.createInstance();
    } else {
      c16 = (_cs.defaultVariant || _cs.children[0]).createInstance();
    }
  } else if (_cs) {
    c16 = _cs.createInstance();
  } else {
    c16 = figma.createFrame();
    c16.name = 'Missing: targetComponent';
  }
})();
c16.name = 'Link Once clicked';
c15.appendChild(c16);
var c17 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });
c17.fontName = { family: 'Inter', style: 'Medium' };
c17.fontSize = 12;
c17.characters = 'Once clicked';
c17.fills = [{ type: 'SOLID', color: hexToRgb('#888888') }];
c15.appendChild(c17);
c2.appendChild(c15);
c15.layoutSizingHorizontal = 'HUG';
c15.layoutSizingVertical = 'HUG';
var c18 = figma.createFrame();
c18.name = 'Disabled';
c18.layoutMode = 'VERTICAL';
c18.itemSpacing = 8;
c18.paddingTop = 0;
c18.paddingRight = 0;
c18.paddingBottom = 0;
c18.paddingLeft = 0;
c18.primaryAxisSizingMode = 'AUTO';
c18.counterAxisSizingMode = 'AUTO';
c18.fills = [];
var c19;
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
      c19 = _target.createInstance();
    } else {
      c19 = (_cs.defaultVariant || _cs.children[0]).createInstance();
    }
  } else if (_cs) {
    c19 = _cs.createInstance();
  } else {
    c19 = figma.createFrame();
    c19.name = 'Missing: targetComponent';
  }
})();
c19.name = 'Link Disabled';
c18.appendChild(c19);
var c20 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });
c20.fontName = { family: 'Inter', style: 'Medium' };
c20.fontSize = 12;
c20.characters = 'Disabled';
c20.fills = [{ type: 'SOLID', color: hexToRgb('#888888') }];
c18.appendChild(c20);
c2.appendChild(c18);
c18.layoutSizingHorizontal = 'HUG';
c18.layoutSizingVertical = 'HUG';
c0_slot.appendChild(c2);
_fillH(c2);
c2.layoutSizingVertical = 'HUG';
var c21 = figma.createRectangle();
c21.name = 'Divider';
c21.resize(300, 1);
c21.fills = [{ type: 'SOLID', color: hexToRgb('#E0E0E0') }];
c0_slot.appendChild(c21);
var c22 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });
c22.fontName = { family: 'Inter', style: 'Semi Bold' };
c22.fontSize = 16;
c22.characters = 'Theme comparison';
c22.fills = [{ type: 'SOLID', color: hexToRgb('#1A1A2E') }];
c0_slot.appendChild(c22);
var c23 = figma.createFrame();
c23.name = 'Theme comparison row';
c23.layoutMode = 'HORIZONTAL';
c23.itemSpacing = 24;
c23.paddingTop = 0;
c23.paddingRight = 0;
c23.paddingBottom = 0;
c23.paddingLeft = 0;
c23.primaryAxisSizingMode = 'AUTO';
c23.counterAxisSizingMode = 'AUTO';
c23.fills = [];
var c24 = figma.createFrame();
c24.name = 'Theme: Actian';
c24.layoutMode = 'VERTICAL';
c24.itemSpacing = 8;
c24.paddingTop = 16;
c24.paddingRight = 16;
c24.paddingBottom = 16;
c24.paddingLeft = 16;
c24.primaryAxisSizingMode = 'AUTO';
c24.counterAxisSizingMode = 'AUTO';
c24.fills = [{ type: 'SOLID', color: hexToRgb('#FFFFFF') }];
c24.cornerRadius = 8;
var c25 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });
c25.fontName = { family: 'Inter', style: 'Semi Bold' };
c25.fontSize = 14;
c25.characters = 'Actian';
c25.fills = [{ type: 'SOLID', color: hexToRgb('#1A1A2E') }];
c24.appendChild(c25);
var c26 = figma.createFrame();
c26.name = 'Swatches';
c26.layoutMode = 'HORIZONTAL';
c26.itemSpacing = 12;
c26.paddingTop = 0;
c26.paddingRight = 0;
c26.paddingBottom = 0;
c26.paddingLeft = 0;
c26.primaryAxisSizingMode = 'AUTO';
c26.counterAxisSizingMode = 'AUTO';
c26.fills = [];
var c27 = figma.createEllipse();
c27.name = 'Swatch';
c27.resize(16, 16);
c27.fills = [{ type: 'SOLID', color: hexToRgb('#0550DC') }];
c26.appendChild(c27);
var c28 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
c28.fontName = { family: 'Inter', style: 'Regular' };
c28.fontSize = 11;
c28.characters = 'theme-primary';
c28.fills = [{ type: 'SOLID', color: hexToRgb('#595968') }];
c26.appendChild(c28);
c24.appendChild(c26);
c26.layoutSizingHorizontal = 'HUG';
c26.layoutSizingVertical = 'HUG';
c23.appendChild(c24);
c24.layoutSizingHorizontal = 'HUG';
c24.layoutSizingVertical = 'HUG';
var c29 = figma.createFrame();
c29.name = 'Theme: Studio';
c29.layoutMode = 'VERTICAL';
c29.itemSpacing = 8;
c29.paddingTop = 16;
c29.paddingRight = 16;
c29.paddingBottom = 16;
c29.paddingLeft = 16;
c29.primaryAxisSizingMode = 'AUTO';
c29.counterAxisSizingMode = 'AUTO';
c29.fills = [{ type: 'SOLID', color: hexToRgb('#FFFFFF') }];
c29.cornerRadius = 8;
var c30 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });
c30.fontName = { family: 'Inter', style: 'Semi Bold' };
c30.fontSize = 14;
c30.characters = 'Studio';
c30.fills = [{ type: 'SOLID', color: hexToRgb('#1A1A2E') }];
c29.appendChild(c30);
var c31 = figma.createFrame();
c31.name = 'Swatches';
c31.layoutMode = 'HORIZONTAL';
c31.itemSpacing = 12;
c31.paddingTop = 0;
c31.paddingRight = 0;
c31.paddingBottom = 0;
c31.paddingLeft = 0;
c31.primaryAxisSizingMode = 'AUTO';
c31.counterAxisSizingMode = 'AUTO';
c31.fills = [];
var c32 = figma.createEllipse();
c32.name = 'Swatch';
c32.resize(16, 16);
c32.fills = [{ type: 'SOLID', color: hexToRgb('#0283BE') }];
c31.appendChild(c32);
var c33 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
c33.fontName = { family: 'Inter', style: 'Regular' };
c33.fontSize = 11;
c33.characters = 'theme-primary';
c33.fills = [{ type: 'SOLID', color: hexToRgb('#595968') }];
c31.appendChild(c33);
c29.appendChild(c31);
c31.layoutSizingHorizontal = 'HUG';
c31.layoutSizingVertical = 'HUG';
c23.appendChild(c29);
c29.layoutSizingHorizontal = 'HUG';
c29.layoutSizingVertical = 'HUG';
var c34 = figma.createFrame();
c34.name = 'Theme: Explorer';
c34.layoutMode = 'VERTICAL';
c34.itemSpacing = 8;
c34.paddingTop = 16;
c34.paddingRight = 16;
c34.paddingBottom = 16;
c34.paddingLeft = 16;
c34.primaryAxisSizingMode = 'AUTO';
c34.counterAxisSizingMode = 'AUTO';
c34.fills = [{ type: 'SOLID', color: hexToRgb('#FFFFFF') }];
c34.cornerRadius = 8;
var c35 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });
c35.fontName = { family: 'Inter', style: 'Semi Bold' };
c35.fontSize = 14;
c35.characters = 'Explorer';
c35.fills = [{ type: 'SOLID', color: hexToRgb('#1A1A2E') }];
c34.appendChild(c35);
var c36 = figma.createFrame();
c36.name = 'Swatches';
c36.layoutMode = 'HORIZONTAL';
c36.itemSpacing = 12;
c36.paddingTop = 0;
c36.paddingRight = 0;
c36.paddingBottom = 0;
c36.paddingLeft = 0;
c36.primaryAxisSizingMode = 'AUTO';
c36.counterAxisSizingMode = 'AUTO';
c36.fills = [];
var c37 = figma.createEllipse();
c37.name = 'Swatch';
c37.resize(16, 16);
c37.fills = [{ type: 'SOLID', color: hexToRgb('#049B98') }];
c36.appendChild(c37);
var c38 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
c38.fontName = { family: 'Inter', style: 'Regular' };
c38.fontSize = 11;
c38.characters = 'theme-primary';
c38.fills = [{ type: 'SOLID', color: hexToRgb('#595968') }];
c36.appendChild(c38);
c34.appendChild(c36);
c36.layoutSizingHorizontal = 'HUG';
c36.layoutSizingVertical = 'HUG';
c23.appendChild(c34);
c34.layoutSizingHorizontal = 'HUG';
c34.layoutSizingVertical = 'HUG';
c0_slot.appendChild(c23);
_fillH(c23);
c23.layoutSizingVertical = 'HUG';
_wrapper.appendChild(c0);
_nodeCount++;

// Tag with plugin data
_wrapper.setSharedPluginData('actian_ds', 'skill', 'component-brief');
_wrapper.setSharedPluginData('actian_ds', 'pushed_at', new Date().toISOString());

// Return metadata
return { wrapperId: _wrapper.id, nodeCount: _nodeCount };