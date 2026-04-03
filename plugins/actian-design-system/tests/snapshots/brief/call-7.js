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
c0.name = 'Content guidelines';
c0.resize(1200, c0.height);
setProp(c0, 'Title', 'Content guidelines');
setProp(c0, 'Subtitle', 'Label copy rules for Link');
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
c1.characters = 'Use clear and descriptive link text';
c1.fills = [{ type: 'SOLID', color: hexToRgb('#1A1A2E') }];
c0_slot.appendChild(c1);
var c2 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
c2.fontName = { family: 'Inter', style: 'Regular' };
c2.fontSize = 14;
c2.characters = 'Link text should describe the destination or action. Avoid generic phrases that require surrounding context to understand.';
c2.fills = [{ type: 'SOLID', color: hexToRgb('#595968') }];
c0_slot.appendChild(c2);
var c3;
(function() {
  var _cs = _imp_doDontPair;
  if (_cs.type === 'COMPONENT_SET') {
    var _variants = _cs.children;
    var _target = null;
    for (var _i = 0; _i < _variants.length; _i++) {
      if (_variants[_i].name === 'Mode=DS') { _target = _variants[_i]; break; }
    }
    if (!_target) {
      for (var _j = 0; _j < _variants.length; _j++) {
        if (_variants[_j].name.indexOf('Mode=DS') !== -1) { _target = _variants[_j]; break; }
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
c3.name = 'Do-Dont: Use clear and descriptive link text';
setProp(c3, 'Do Label', 'View your order details');
setProp(c3, 'Do Example', '');
setProp(c3, 'Don\'t Label', 'Click here');
setProp(c3, 'Don\'t Example', '');
c0_slot.appendChild(c3);
_fillH(c3);
c3.layoutSizingVertical = 'HUG';
var c4 = figma.createRectangle();
c4.name = 'Divider';
c4.resize(300, 1);
c4.fills = [{ type: 'SOLID', color: hexToRgb('#E0E0E0') }];
c0_slot.appendChild(c4);
var c5 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });
c5.fontName = { family: 'Inter', style: 'Semi Bold' };
c5.fontSize = 16;
c5.characters = 'Use action-oriented language';
c5.fills = [{ type: 'SOLID', color: hexToRgb('#1A1A2E') }];
c0_slot.appendChild(c5);
var c6 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
c6.fontName = { family: 'Inter', style: 'Regular' };
c6.fontSize = 14;
c6.characters = 'For links that lead to tasks, use precise action verbs. This is especially important for links for actions like downloads.';
c6.fills = [{ type: 'SOLID', color: hexToRgb('#595968') }];
c0_slot.appendChild(c6);
var c7;
(function() {
  var _cs = _imp_doDontPair;
  if (_cs.type === 'COMPONENT_SET') {
    var _variants = _cs.children;
    var _target = null;
    for (var _i = 0; _i < _variants.length; _i++) {
      if (_variants[_i].name === 'Mode=DS') { _target = _variants[_i]; break; }
    }
    if (!_target) {
      for (var _j = 0; _j < _variants.length; _j++) {
        if (_variants[_j].name.indexOf('Mode=DS') !== -1) { _target = _variants[_j]; break; }
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
c7.name = 'Do-Dont: Use action-oriented language';
setProp(c7, 'Do Label', 'Download report');
setProp(c7, 'Do Example', '');
setProp(c7, 'Don\'t Label', 'Get report');
setProp(c7, 'Don\'t Example', '');
c0_slot.appendChild(c7);
_fillH(c7);
c7.layoutSizingVertical = 'HUG';
var c8 = figma.createRectangle();
c8.name = 'Divider';
c8.resize(300, 1);
c8.fills = [{ type: 'SOLID', color: hexToRgb('#E0E0E0') }];
c0_slot.appendChild(c8);
var c9 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });
c9.fontName = { family: 'Inter', style: 'Semi Bold' };
c9.fontSize = 16;
c9.characters = 'Use sentence case';
c9.fills = [{ type: 'SOLID', color: hexToRgb('#1A1A2E') }];
c0_slot.appendChild(c9);
var c10 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
c10.fontName = { family: 'Inter', style: 'Regular' };
c10.fontSize = 14;
c10.characters = 'Capitalize only the first word and proper nouns. Always provide clarity on what will happen when the user clicks.';
c10.fills = [{ type: 'SOLID', color: hexToRgb('#595968') }];
c0_slot.appendChild(c10);
var c11;
(function() {
  var _cs = _imp_doDontPair;
  if (_cs.type === 'COMPONENT_SET') {
    var _variants = _cs.children;
    var _target = null;
    for (var _i = 0; _i < _variants.length; _i++) {
      if (_variants[_i].name === 'Mode=DS') { _target = _variants[_i]; break; }
    }
    if (!_target) {
      for (var _j = 0; _j < _variants.length; _j++) {
        if (_variants[_j].name.indexOf('Mode=DS') !== -1) { _target = _variants[_j]; break; }
      }
    }
    if (_target) {
      c11 = _target.createInstance();
    } else {
      c11 = (_cs.defaultVariant || _cs.children[0]).createInstance();
    }
  } else {
    c11 = _cs.createInstance();
  }
})();
c11.name = 'Do-Dont: Use sentence case';
setProp(c11, 'Do Label', 'Explore features');
setProp(c11, 'Do Example', '');
setProp(c11, 'Don\'t Label', 'Click to learn more');
setProp(c11, 'Don\'t Example', '');
c0_slot.appendChild(c11);
_fillH(c11);
c11.layoutSizingVertical = 'HUG';
var c12 = figma.createRectangle();
c12.name = 'Divider';
c12.resize(300, 1);
c12.fills = [{ type: 'SOLID', color: hexToRgb('#E0E0E0') }];
c0_slot.appendChild(c12);
var c13 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });
c13.fontName = { family: 'Inter', style: 'Semi Bold' };
c13.fontSize = 16;
c13.characters = 'Keep link text concise';
c13.fills = [{ type: 'SOLID', color: hexToRgb('#1A1A2E') }];
c0_slot.appendChild(c13);
var c14 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
c14.fontName = { family: 'Inter', style: 'Regular' };
c14.fontSize = 14;
c14.characters = 'A navigational element\'s text should be short enough to provide clarity on what it does. Should be meaningful but not wordy.';
c14.fills = [{ type: 'SOLID', color: hexToRgb('#595968') }];
c0_slot.appendChild(c14);
var c15;
(function() {
  var _cs = _imp_doDontPair;
  if (_cs.type === 'COMPONENT_SET') {
    var _variants = _cs.children;
    var _target = null;
    for (var _i = 0; _i < _variants.length; _i++) {
      if (_variants[_i].name === 'Mode=DS') { _target = _variants[_i]; break; }
    }
    if (!_target) {
      for (var _j = 0; _j < _variants.length; _j++) {
        if (_variants[_j].name.indexOf('Mode=DS') !== -1) { _target = _variants[_j]; break; }
      }
    }
    if (_target) {
      c15 = _target.createInstance();
    } else {
      c15 = (_cs.defaultVariant || _cs.children[0]).createInstance();
    }
  } else {
    c15 = _cs.createInstance();
  }
})();
c15.name = 'Do-Dont: Keep link text concise';
setProp(c15, 'Do Label', 'View our services');
setProp(c15, 'Do Example', '');
setProp(c15, 'Don\'t Label', 'Click here to view our list of services');
setProp(c15, 'Don\'t Example', '');
c0_slot.appendChild(c15);
_fillH(c15);
c15.layoutSizingVertical = 'HUG';
var c16 = figma.createRectangle();
c16.name = 'Divider';
c16.resize(300, 1);
c16.fills = [{ type: 'SOLID', color: hexToRgb('#E0E0E0') }];
c0_slot.appendChild(c16);
var c17 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });
c17.fontName = { family: 'Inter', style: 'Semi Bold' };
c17.fontSize = 16;
c17.characters = 'Avoid linking full sentences or paragraphs';
c17.fills = [{ type: 'SOLID', color: hexToRgb('#1A1A2E') }];
c0_slot.appendChild(c17);
var c18 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
c18.fontName = { family: 'Inter', style: 'Regular' };
c18.fontSize = 14;
c18.characters = 'Link only the specific actionable words, not entire sentences. Avoid formatting entire sentences as clickable links to improve readability.';
c18.fills = [{ type: 'SOLID', color: hexToRgb('#595968') }];
c0_slot.appendChild(c18);
var c19;
(function() {
  var _cs = _imp_doDontPair;
  if (_cs.type === 'COMPONENT_SET') {
    var _variants = _cs.children;
    var _target = null;
    for (var _i = 0; _i < _variants.length; _i++) {
      if (_variants[_i].name === 'Mode=DS') { _target = _variants[_i]; break; }
    }
    if (!_target) {
      for (var _j = 0; _j < _variants.length; _j++) {
        if (_variants[_j].name.indexOf('Mode=DS') !== -1) { _target = _variants[_j]; break; }
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
c19.name = 'Do-Dont: Avoid linking full sentences or paragraphs';
setProp(c19, 'Do Label', 'Read our user experience design blog');
setProp(c19, 'Do Example', '');
setProp(c19, 'Don\'t Label', 'Click here to read our blog about user experience design');
setProp(c19, 'Don\'t Example', '');
c0_slot.appendChild(c19);
_fillH(c19);
c19.layoutSizingVertical = 'HUG';
var c20 = figma.createRectangle();
c20.name = 'Divider';
c20.resize(300, 1);
c20.fills = [{ type: 'SOLID', color: hexToRgb('#E0E0E0') }];
c0_slot.appendChild(c20);
var c21 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });
c21.fontName = { family: 'Inter', style: 'Semi Bold' };
c21.fontSize = 16;
c21.characters = 'Consistency in link text';
c21.fills = [{ type: 'SOLID', color: hexToRgb('#1A1A2E') }];
c0_slot.appendChild(c21);
var c22 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
c22.fontName = { family: 'Inter', style: 'Regular' };
c22.fontSize = 14;
c22.characters = 'Use consistent phrasing for similar link actions. Inline labels should use the same terminology to "Read more" destinations, not switch between "See more", "Learn more", etc.';
c22.fills = [{ type: 'SOLID', color: hexToRgb('#595968') }];
c0_slot.appendChild(c22);
var c23;
(function() {
  var _cs = _imp_doDontPair;
  if (_cs.type === 'COMPONENT_SET') {
    var _variants = _cs.children;
    var _target = null;
    for (var _i = 0; _i < _variants.length; _i++) {
      if (_variants[_i].name === 'Mode=DS') { _target = _variants[_i]; break; }
    }
    if (!_target) {
      for (var _j = 0; _j < _variants.length; _j++) {
        if (_variants[_j].name.indexOf('Mode=DS') !== -1) { _target = _variants[_j]; break; }
      }
    }
    if (_target) {
      c23 = _target.createInstance();
    } else {
      c23 = (_cs.defaultVariant || _cs.children[0]).createInstance();
    }
  } else {
    c23 = _cs.createInstance();
  }
})();
c23.name = 'Do-Dont: Consistency in link text';
setProp(c23, 'Do Label', 'View our services');
setProp(c23, 'Do Example', '');
setProp(c23, 'Don\'t Label', 'Click here to view our list of services');
setProp(c23, 'Don\'t Example', '');
c0_slot.appendChild(c23);
_fillH(c23);
c23.layoutSizingVertical = 'HUG';
var c24 = figma.createRectangle();
c24.name = 'Divider';
c24.resize(300, 1);
c24.fills = [{ type: 'SOLID', color: hexToRgb('#E0E0E0') }];
c0_slot.appendChild(c24);
var c25 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });
c25.fontName = { family: 'Inter', style: 'Semi Bold' };
c25.fontSize = 16;
c25.characters = 'Terminology';
c25.fills = [{ type: 'SOLID', color: hexToRgb('#1A1A2E') }];
c0_slot.appendChild(c25);
var c26 = figma.createFrame();
c26.name = 'Terminology table';
c26.layoutMode = 'VERTICAL';
c26.itemSpacing = 0;
c26.paddingTop = 0;
c26.paddingRight = 0;
c26.paddingBottom = 0;
c26.paddingLeft = 0;
c26.primaryAxisSizingMode = 'AUTO';
c26.counterAxisSizingMode = 'AUTO';
c26.fills = [];
var c27 = figma.createFrame();
c27.name = 'Header';
c27.layoutMode = 'HORIZONTAL';
c27.itemSpacing = 0;
c27.paddingTop = 8;
c27.paddingRight = 12;
c27.paddingBottom = 8;
c27.paddingLeft = 12;
c27.primaryAxisSizingMode = 'AUTO';
c27.counterAxisSizingMode = 'AUTO';
c27.fills = [{ type: 'SOLID', color: hexToRgb('#F5F5FA') }];
var c28 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
c28.fontName = { family: 'Inter', style: 'Bold' };
c28.fontSize = 12;
c28.characters = 'Term';
c28.fills = [{ type: 'SOLID', color: hexToRgb('#595968') }];
c28.resize(160, c28.height);
c28.textAutoResize = 'HEIGHT';
c27.appendChild(c28);
var c29 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
c29.fontName = { family: 'Inter', style: 'Bold' };
c29.fontSize = 12;
c29.characters = 'When to use';
c29.fills = [{ type: 'SOLID', color: hexToRgb('#595968') }];
c29.resize(500, c29.height);
c29.textAutoResize = 'HEIGHT';
c27.appendChild(c29);
c26.appendChild(c27);
_fillH(c27);
c27.layoutSizingVertical = 'HUG';
var c30 = figma.createFrame();
c30.name = 'Row 0';
c30.layoutMode = 'HORIZONTAL';
c30.itemSpacing = 0;
c30.paddingTop = 8;
c30.paddingRight = 12;
c30.paddingBottom = 8;
c30.paddingLeft = 12;
c30.primaryAxisSizingMode = 'AUTO';
c30.counterAxisSizingMode = 'AUTO';
c30.fills = [];
var c31 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });
c31.fontName = { family: 'Inter', style: 'Semi Bold' };
c31.fontSize = 14;
c31.characters = 'Link';
c31.fills = [{ type: 'SOLID', color: hexToRgb('#1A1A2E') }];
c31.resize(160, c31.height);
c31.textAutoResize = 'HEIGHT';
c30.appendChild(c31);
var c32 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
c32.fontName = { family: 'Inter', style: 'Regular' };
c32.fontSize = 14;
c32.characters = 'A navigational element that takes the user to a new destination';
c32.fills = [{ type: 'SOLID', color: hexToRgb('#595968') }];
c32.resize(500, c32.height);
c32.textAutoResize = 'HEIGHT';
c30.appendChild(c32);
c26.appendChild(c30);
_fillH(c30);
c30.layoutSizingVertical = 'HUG';
var c33 = figma.createFrame();
c33.name = 'Row 1';
c33.layoutMode = 'HORIZONTAL';
c33.itemSpacing = 0;
c33.paddingTop = 8;
c33.paddingRight = 12;
c33.paddingBottom = 8;
c33.paddingLeft = 12;
c33.primaryAxisSizingMode = 'AUTO';
c33.counterAxisSizingMode = 'AUTO';
c33.fills = [];
var c34 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });
c34.fontName = { family: 'Inter', style: 'Semi Bold' };
c34.fontSize = 14;
c34.characters = 'Button';
c34.fills = [{ type: 'SOLID', color: hexToRgb('#1A1A2E') }];
c34.resize(160, c34.height);
c34.textAutoResize = 'HEIGHT';
c33.appendChild(c34);
var c35 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
c35.fontName = { family: 'Inter', style: 'Regular' };
c35.fontSize = 14;
c35.characters = 'An action trigger — use when the click performs an action rather than navigating';
c35.fills = [{ type: 'SOLID', color: hexToRgb('#595968') }];
c35.resize(500, c35.height);
c35.textAutoResize = 'HEIGHT';
c33.appendChild(c35);
c26.appendChild(c33);
_fillH(c33);
c33.layoutSizingVertical = 'HUG';
c0_slot.appendChild(c26);
_fillH(c26);
c26.layoutSizingVertical = 'HUG';
_wrapper.appendChild(c0);
_nodeCount++;

// Tag with plugin data
_wrapper.setSharedPluginData('actian_ds', 'skill', 'component-brief');
_wrapper.setSharedPluginData('actian_ds', 'pushed_at', new Date().toISOString());

// Return metadata
return { wrapperId: _wrapper.id, nodeCount: _nodeCount };