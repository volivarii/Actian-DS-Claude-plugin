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
c0.name = 'Usage guidelines';
c0.resize(1200, c0.height);
setProp(c0, 'Title', 'Usage guidelines');
setProp(c0, 'Subtitle', 'When and how to use Link');
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
c1.characters = 'When to use';
c1.fills = [{ type: 'SOLID', color: hexToRgb('#1A1A2E') }];
c0_slot.appendChild(c1);
var c2 = figma.createFrame();
c2.name = 'Bullet: Navigation to internal or external desti';
c2.layoutMode = 'HORIZONTAL';
c2.itemSpacing = 8;
c2.paddingTop = 0;
c2.paddingRight = 0;
c2.paddingBottom = 0;
c2.paddingLeft = 0;
c2.primaryAxisSizingMode = 'AUTO';
c2.counterAxisSizingMode = 'AUTO';
c2.fills = [];
var c3 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
c3.fontName = { family: 'Inter', style: 'Bold' };
c3.fontSize = 14;
c3.characters = '+';
c3.fills = [{ type: 'SOLID', color: hexToRgb('#047800') }];
c2.appendChild(c3);
var c4 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
c4.fontName = { family: 'Inter', style: 'Regular' };
c4.fontSize = 14;
c4.characters = 'Navigation to internal or external destinations (pages, sections, resources)';
c4.fills = [{ type: 'SOLID', color: hexToRgb('#1A1A2E') }];
c2.appendChild(c4);
c0_slot.appendChild(c2);
_fillH(c2);
c2.layoutSizingVertical = 'HUG';
var c5 = figma.createFrame();
c5.name = 'Bullet: Inline contextual navigation within body';
c5.layoutMode = 'HORIZONTAL';
c5.itemSpacing = 8;
c5.paddingTop = 0;
c5.paddingRight = 0;
c5.paddingBottom = 0;
c5.paddingLeft = 0;
c5.primaryAxisSizingMode = 'AUTO';
c5.counterAxisSizingMode = 'AUTO';
c5.fills = [];
var c6 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
c6.fontName = { family: 'Inter', style: 'Bold' };
c6.fontSize = 14;
c6.characters = '+';
c6.fills = [{ type: 'SOLID', color: hexToRgb('#047800') }];
c5.appendChild(c6);
var c7 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
c7.fontName = { family: 'Inter', style: 'Regular' };
c7.fontSize = 14;
c7.characters = 'Inline contextual navigation within body text or descriptions';
c7.fills = [{ type: 'SOLID', color: hexToRgb('#1A1A2E') }];
c5.appendChild(c7);
c0_slot.appendChild(c5);
_fillH(c5);
c5.layoutSizingVertical = 'HUG';
var c8 = figma.createFrame();
c8.name = 'Bullet: Standalone navigation elements like brea';
c8.layoutMode = 'HORIZONTAL';
c8.itemSpacing = 8;
c8.paddingTop = 0;
c8.paddingRight = 0;
c8.paddingBottom = 0;
c8.paddingLeft = 0;
c8.primaryAxisSizingMode = 'AUTO';
c8.counterAxisSizingMode = 'AUTO';
c8.fills = [];
var c9 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
c9.fontName = { family: 'Inter', style: 'Bold' };
c9.fontSize = 14;
c9.characters = '+';
c9.fills = [{ type: 'SOLID', color: hexToRgb('#047800') }];
c8.appendChild(c9);
var c10 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
c10.fontName = { family: 'Inter', style: 'Regular' };
c10.fontSize = 14;
c10.characters = 'Standalone navigation elements like breadcrumbs or footer links';
c10.fills = [{ type: 'SOLID', color: hexToRgb('#1A1A2E') }];
c8.appendChild(c10);
c0_slot.appendChild(c8);
_fillH(c8);
c8.layoutSizingVertical = 'HUG';
var c11 = figma.createRectangle();
c11.name = 'Divider';
c11.resize(300, 1);
c11.fills = [{ type: 'SOLID', color: hexToRgb('#E0E0E0') }];
c0_slot.appendChild(c11);
var c12 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });
c12.fontName = { family: 'Inter', style: 'Semi Bold' };
c12.fontSize = 16;
c12.characters = 'When NOT to use';
c12.fills = [{ type: 'SOLID', color: hexToRgb('#1A1A2E') }];
c0_slot.appendChild(c12);
var c13 = figma.createFrame();
c13.name = 'Bullet: Actions that don\'t navigate (submit, del';
c13.layoutMode = 'HORIZONTAL';
c13.itemSpacing = 8;
c13.paddingTop = 0;
c13.paddingRight = 0;
c13.paddingBottom = 0;
c13.paddingLeft = 0;
c13.primaryAxisSizingMode = 'AUTO';
c13.counterAxisSizingMode = 'AUTO';
c13.fills = [];
var c14 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
c14.fontName = { family: 'Inter', style: 'Bold' };
c14.fontSize = 14;
c14.characters = '−';
c14.fills = [{ type: 'SOLID', color: hexToRgb('#C10C0D') }];
c13.appendChild(c14);
var c15 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
c15.fontName = { family: 'Inter', style: 'Regular' };
c15.fontSize = 14;
c15.characters = 'Actions that don\'t navigate (submit, delete, toggle) → use Button';
c15.fills = [{ type: 'SOLID', color: hexToRgb('#1A1A2E') }];
c13.appendChild(c15);
c0_slot.appendChild(c13);
_fillH(c13);
c13.layoutSizingVertical = 'HUG';
var c16 = figma.createFrame();
c16.name = 'Bullet: Primary call-to-action → use Button with';
c16.layoutMode = 'HORIZONTAL';
c16.itemSpacing = 8;
c16.paddingTop = 0;
c16.paddingRight = 0;
c16.paddingBottom = 0;
c16.paddingLeft = 0;
c16.primaryAxisSizingMode = 'AUTO';
c16.counterAxisSizingMode = 'AUTO';
c16.fills = [];
var c17 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
c17.fontName = { family: 'Inter', style: 'Bold' };
c17.fontSize = 14;
c17.characters = '−';
c17.fills = [{ type: 'SOLID', color: hexToRgb('#C10C0D') }];
c16.appendChild(c17);
var c18 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
c18.fontName = { family: 'Inter', style: 'Regular' };
c18.fontSize = 14;
c18.characters = 'Primary call-to-action → use Button with appropriate hierarchy';
c18.fills = [{ type: 'SOLID', color: hexToRgb('#1A1A2E') }];
c16.appendChild(c18);
c0_slot.appendChild(c16);
_fillH(c16);
c16.layoutSizingVertical = 'HUG';
var c19 = figma.createFrame();
c19.name = 'Bullet: Standalone icons as navigation → use Ico';
c19.layoutMode = 'HORIZONTAL';
c19.itemSpacing = 8;
c19.paddingTop = 0;
c19.paddingRight = 0;
c19.paddingBottom = 0;
c19.paddingLeft = 0;
c19.primaryAxisSizingMode = 'AUTO';
c19.counterAxisSizingMode = 'AUTO';
c19.fills = [];
var c20 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
c20.fontName = { family: 'Inter', style: 'Bold' };
c20.fontSize = 14;
c20.characters = '−';
c20.fills = [{ type: 'SOLID', color: hexToRgb('#C10C0D') }];
c19.appendChild(c20);
var c21 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
c21.fontName = { family: 'Inter', style: 'Regular' };
c21.fontSize = 14;
c21.characters = 'Standalone icons as navigation → use Icon Button instead';
c21.fills = [{ type: 'SOLID', color: hexToRgb('#1A1A2E') }];
c19.appendChild(c21);
c0_slot.appendChild(c19);
_fillH(c19);
c19.layoutSizingVertical = 'HUG';
var c22 = figma.createRectangle();
c22.name = 'Divider';
c22.resize(300, 1);
c22.fills = [{ type: 'SOLID', color: hexToRgb('#E0E0E0') }];
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
c23.name = 'Do-Dont: Use for navigation';
setProp(c23, 'Do Label', 'Use for navigation');
setProp(c23, 'Do Example', 'Links should always navigate to a destination — a new page, section, or external resource.');
setProp(c23, 'Don\'t Label', 'Use for actions');
setProp(c23, 'Don\'t Example', 'Don\'t use links for actions like submitting a form or deleting an item. Use ghost buttons instead.');
c0_slot.appendChild(c23);
_fillH(c23);
c23.layoutSizingVertical = 'HUG';
var c24;
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
      c24 = _target.createInstance();
    } else {
      c24 = (_cs.defaultVariant || _cs.children[0]).createInstance();
    }
  } else {
    c24 = _cs.createInstance();
  }
})();
c24.name = 'Do-Dont: Use descriptive text';
setProp(c24, 'Do Label', 'Use descriptive text');
setProp(c24, 'Do Example', 'Link text should describe the destination clearly, e.g., \'View pipeline details\'.');
setProp(c24, 'Don\'t Label', 'Use vague text');
setProp(c24, 'Don\'t Example', 'Avoid generic labels like \'Click here\', \'Read more\', or raw URLs as link text.');
c0_slot.appendChild(c24);
_fillH(c24);
c24.layoutSizingVertical = 'HUG';
var c25;
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
      c25 = _target.createInstance();
    } else {
      c25 = (_cs.defaultVariant || _cs.children[0]).createInstance();
    }
  } else {
    c25 = _cs.createInstance();
  }
})();
c25.name = 'Do-Dont: Indicate external links';
setProp(c25, 'Do Label', 'Indicate external links');
setProp(c25, 'Do Example', 'Add a trailing icon or label when the link opens in a new tab or goes to an external site.');
setProp(c25, 'Don\'t Label', 'Surprise navigation');
setProp(c25, 'Don\'t Example', 'Don\'t open links in new tabs without visual indication — users should anticipate the behavior.');
c0_slot.appendChild(c25);
_fillH(c25);
c25.layoutSizingVertical = 'HUG';
_wrapper.appendChild(c0);
_nodeCount++;

// Tag with plugin data
_wrapper.setSharedPluginData('actian_ds', 'skill', 'component-brief');
_wrapper.setSharedPluginData('actian_ds', 'pushed_at', new Date().toISOString());

// Return metadata
return { wrapperId: _wrapper.id, nodeCount: _nodeCount };