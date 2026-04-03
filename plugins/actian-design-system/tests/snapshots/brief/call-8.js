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
c0.name = 'Accessibility';
c0.resize(1200, c0.height);
setProp(c0, 'Title', 'Accessibility');
setProp(c0, 'Subtitle', 'WCAG 2.1 AA requirements and code patterns');
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
c1.characters = 'Requirements';
c1.fills = [{ type: 'SOLID', color: hexToRgb('#1A1A2E') }];
c0_slot.appendChild(c1);
var c2 = figma.createFrame();
c2.name = 'Requirements grid';
c2.layoutMode = 'HORIZONTAL';
c2.itemSpacing = 16;
c2.counterAxisSpacing = 16;
c2.layoutWrap = 'WRAP';
c2.paddingTop = 0;
c2.paddingRight = 0;
c2.paddingBottom = 0;
c2.paddingLeft = 0;
c2.primaryAxisSizingMode = 'AUTO';
c2.counterAxisSizingMode = 'AUTO';
c2.fills = [];
var c3;
(function() {
  var _cs = _imp_a11yCard;
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
c3.name = 'Default state: underlined';
setProp(c3, 'Title', 'Default state: underlined');
setProp(c3, 'Body', 'Standard practice is to underline links in their default state. This ensures the link is distinguishable from surrounding text by a visual cue other than color alone.');
setProp(c3, 'Icon Color', 'blue');
c3 = c3.detachInstance();
var c3_slot = c3.findOne(function(n) { return n.name === "Content"; }) || c3;
if (c3_slot !== c3) {
  while (c3_slot.children.length) c3_slot.children[0].remove();
}
var c4;
(function() {
  var _cs = _imp_codeBlock;
  if (_cs.type === 'COMPONENT_SET') {
    c4 = (_cs.defaultVariant || _cs.children[0]).createInstance();
  } else {
    c4 = _cs.createInstance();
  }
})();
c4.name = 'Code: default-state:-underlined';
c4 = c4.detachInstance();
var c4_slot = c4.findOne(function(n) { return n.name === "Content"; }) || c4;
if (c4_slot !== c4) {
  while (c4_slot.children.length) c4_slot.children[0].remove();
}
var c5 = figma.createText();
c5.name = 'Code';
await figma.loadFontAsync({ family: 'Fira Code', style: 'Regular' });
c5.fontName = { family: 'Fira Code', style: 'Regular' };
c5.fontSize = 12;
c5.characters = 'a { text-decoration: underline; }';
c5.fills = [{ type: 'SOLID', color: hexToRgb('#BABED8') }];
c4_slot.appendChild(c5);
c3_slot.appendChild(c4);
c2.appendChild(c3);
_fillH(c3);
c3.layoutSizingVertical = 'HUG';
var c6;
(function() {
  var _cs = _imp_a11yCard;
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
      c6 = _target.createInstance();
    } else {
      c6 = (_cs.defaultVariant || _cs.children[0]).createInstance();
    }
  } else {
    c6 = _cs.createInstance();
  }
})();
c6.name = 'Non-underlined link contrast';
setProp(c6, 'Title', 'Non-underlined link contrast');
setProp(c6, 'Body', 'When links are not underlined by default, they must have at least 3:1 contrast ratio against surrounding body text, and 4.5:1 against background. A non-color indicator must appear on hover/focus.');
setProp(c6, 'Icon Color', 'red');
c6 = c6.detachInstance();
var c6_slot = c6.findOne(function(n) { return n.name === "Content"; }) || c6;
if (c6_slot !== c6) {
  while (c6_slot.children.length) c6_slot.children[0].remove();
}
var c7;
(function() {
  var _cs = _imp_codeBlock;
  if (_cs.type === 'COMPONENT_SET') {
    c7 = (_cs.defaultVariant || _cs.children[0]).createInstance();
  } else {
    c7 = _cs.createInstance();
  }
})();
c7.name = 'Code: non-underlined-link-contrast';
c7 = c7.detachInstance();
var c7_slot = c7.findOne(function(n) { return n.name === "Content"; }) || c7;
if (c7_slot !== c7) {
  while (c7_slot.children.length) c7_slot.children[0].remove();
}
var c8 = figma.createText();
c8.name = 'Code';
await figma.loadFontAsync({ family: 'Fira Code', style: 'Regular' });
c8.fontName = { family: 'Fira Code', style: 'Regular' };
c8.fontSize = 12;
c8.characters = '/* 3:1 vs body text */
/* 4.5:1 vs background */';
c8.fills = [{ type: 'SOLID', color: hexToRgb('#BABED8') }];
c7_slot.appendChild(c8);
c6_slot.appendChild(c7);
c2.appendChild(c6);
_fillH(c6);
c6.layoutSizingVertical = 'HUG';
var c9;
(function() {
  var _cs = _imp_a11yCard;
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
      c9 = _target.createInstance();
    } else {
      c9 = (_cs.defaultVariant || _cs.children[0]).createInstance();
    }
  } else {
    c9 = _cs.createInstance();
  }
})();
c9.name = 'Focus indication';
setProp(c9, 'Title', 'Focus indication');
setProp(c9, 'Body', 'Links must have a visible focus indicator when navigated via keyboard. Use a 2px outline with 2px offset in the theme-primary color.');
setProp(c9, 'Icon Color', 'blue');
c9 = c9.detachInstance();
var c9_slot = c9.findOne(function(n) { return n.name === "Content"; }) || c9;
if (c9_slot !== c9) {
  while (c9_slot.children.length) c9_slot.children[0].remove();
}
var c10;
(function() {
  var _cs = _imp_codeBlock;
  if (_cs.type === 'COMPONENT_SET') {
    c10 = (_cs.defaultVariant || _cs.children[0]).createInstance();
  } else {
    c10 = _cs.createInstance();
  }
})();
c10.name = 'Code: focus-indication';
c10 = c10.detachInstance();
var c10_slot = c10.findOne(function(n) { return n.name === "Content"; }) || c10;
if (c10_slot !== c10) {
  while (c10_slot.children.length) c10_slot.children[0].remove();
}
var c11 = figma.createText();
c11.name = 'Code';
await figma.loadFontAsync({ family: 'Fira Code', style: 'Regular' });
c11.fontName = { family: 'Fira Code', style: 'Regular' };
c11.fontSize = 12;
c11.characters = 'a:focus-visible { outline: 2px solid var(--theme-primary); outline-offset: 2px; }';
c11.fills = [{ type: 'SOLID', color: hexToRgb('#BABED8') }];
c10_slot.appendChild(c11);
c9_slot.appendChild(c10);
c2.appendChild(c9);
_fillH(c9);
c9.layoutSizingVertical = 'HUG';
var c12;
(function() {
  var _cs = _imp_a11yCard;
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
      c12 = _target.createInstance();
    } else {
      c12 = (_cs.defaultVariant || _cs.children[0]).createInstance();
    }
  } else {
    c12 = _cs.createInstance();
  }
})();
c12.name = 'Semantic HTML';
setProp(c12, 'Title', 'Semantic HTML');
setProp(c12, 'Body', 'Always use the native <a> element with a valid href attribute. Never use <span> or <div> styled as a link. The href ensures proper keyboard navigation and screen reader announcements.');
setProp(c12, 'Icon Color', 'green');
c12 = c12.detachInstance();
var c12_slot = c12.findOne(function(n) { return n.name === "Content"; }) || c12;
if (c12_slot !== c12) {
  while (c12_slot.children.length) c12_slot.children[0].remove();
}
var c13;
(function() {
  var _cs = _imp_codeBlock;
  if (_cs.type === 'COMPONENT_SET') {
    c13 = (_cs.defaultVariant || _cs.children[0]).createInstance();
  } else {
    c13 = _cs.createInstance();
  }
})();
c13.name = 'Code: semantic-html';
c13 = c13.detachInstance();
var c13_slot = c13.findOne(function(n) { return n.name === "Content"; }) || c13;
if (c13_slot !== c13) {
  while (c13_slot.children.length) c13_slot.children[0].remove();
}
var c14 = figma.createText();
c14.name = 'Code';
await figma.loadFontAsync({ family: 'Fira Code', style: 'Regular' });
c14.fontName = { family: 'Fira Code', style: 'Regular' };
c14.fontSize = 12;
c14.characters = '<a href="/page">Link text</a>';
c14.fills = [{ type: 'SOLID', color: hexToRgb('#BABED8') }];
c13_slot.appendChild(c14);
c12_slot.appendChild(c13);
c2.appendChild(c12);
_fillH(c12);
c12.layoutSizingVertical = 'HUG';
var c15;
(function() {
  var _cs = _imp_a11yCard;
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
c15.name = 'External link indication';
setProp(c15, 'Title', 'External link indication');
setProp(c15, 'Body', 'External links should include a trailing icon and open in a new tab with rel="noopener noreferrer". Add aria-label or visually hidden text to communicate the behavior.');
setProp(c15, 'Icon Color', 'orange');
c15 = c15.detachInstance();
var c15_slot = c15.findOne(function(n) { return n.name === "Content"; }) || c15;
if (c15_slot !== c15) {
  while (c15_slot.children.length) c15_slot.children[0].remove();
}
var c16;
(function() {
  var _cs = _imp_codeBlock;
  if (_cs.type === 'COMPONENT_SET') {
    c16 = (_cs.defaultVariant || _cs.children[0]).createInstance();
  } else {
    c16 = _cs.createInstance();
  }
})();
c16.name = 'Code: external-link-indication';
c16 = c16.detachInstance();
var c16_slot = c16.findOne(function(n) { return n.name === "Content"; }) || c16;
if (c16_slot !== c16) {
  while (c16_slot.children.length) c16_slot.children[0].remove();
}
var c17 = figma.createText();
c17.name = 'Code';
await figma.loadFontAsync({ family: 'Fira Code', style: 'Regular' });
c17.fontName = { family: 'Fira Code', style: 'Regular' };
c17.fontSize = 12;
c17.characters = '<a href="https://..." target="_blank" rel="noopener">Docs</a>';
c17.fills = [{ type: 'SOLID', color: hexToRgb('#BABED8') }];
c16_slot.appendChild(c17);
c15_slot.appendChild(c16);
c2.appendChild(c15);
_fillH(c15);
c15.layoutSizingVertical = 'HUG';
var c18;
(function() {
  var _cs = _imp_a11yCard;
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
      c18 = _target.createInstance();
    } else {
      c18 = (_cs.defaultVariant || _cs.children[0]).createInstance();
    }
  } else {
    c18 = _cs.createInstance();
  }
})();
c18.name = 'Disabled state';
setProp(c18, 'Title', 'Disabled state');
setProp(c18, 'Body', 'Disabled links should use aria-disabled="true" and remove the href to prevent navigation. Apply muted styling with text-disabled token. Do not rely on pointer-events: none alone.');
setProp(c18, 'Icon Color', 'grey');
c18 = c18.detachInstance();
var c18_slot = c18.findOne(function(n) { return n.name === "Content"; }) || c18;
if (c18_slot !== c18) {
  while (c18_slot.children.length) c18_slot.children[0].remove();
}
var c19;
(function() {
  var _cs = _imp_codeBlock;
  if (_cs.type === 'COMPONENT_SET') {
    c19 = (_cs.defaultVariant || _cs.children[0]).createInstance();
  } else {
    c19 = _cs.createInstance();
  }
})();
c19.name = 'Code: disabled-state';
c19 = c19.detachInstance();
var c19_slot = c19.findOne(function(n) { return n.name === "Content"; }) || c19;
if (c19_slot !== c19) {
  while (c19_slot.children.length) c19_slot.children[0].remove();
}
var c20 = figma.createText();
c20.name = 'Code';
await figma.loadFontAsync({ family: 'Fira Code', style: 'Regular' });
c20.fontName = { family: 'Fira Code', style: 'Regular' };
c20.fontSize = 12;
c20.characters = '<a aria-disabled="true" tabindex="-1">Link</a>';
c20.fills = [{ type: 'SOLID', color: hexToRgb('#BABED8') }];
c19_slot.appendChild(c20);
c18_slot.appendChild(c19);
c2.appendChild(c18);
_fillH(c18);
c18.layoutSizingVertical = 'HUG';
c0_slot.appendChild(c2);
_fillH(c2);
c2.layoutSizingVertical = 'HUG';
_wrapper.appendChild(c0);
_nodeCount++;

// Tag with plugin data
_wrapper.setSharedPluginData('actian_ds', 'skill', 'component-brief');
_wrapper.setSharedPluginData('actian_ds', 'pushed_at', new Date().toISOString());

// Return metadata
return { wrapperId: _wrapper.id, nodeCount: _nodeCount };