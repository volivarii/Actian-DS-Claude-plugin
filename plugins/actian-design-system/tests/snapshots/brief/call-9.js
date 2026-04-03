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
c0.name = 'Accessibility tables';
c0.resize(1200, c0.height);
setProp(c0, 'Title', 'Accessibility tables');
setProp(c0, 'Subtitle', 'Keyboard navigation, ARIA patterns, and contrast ratios');
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
c1.characters = 'ARIA specification';
c1.fills = [{ type: 'SOLID', color: hexToRgb('#1A1A2E') }];
c0_slot.appendChild(c1);
var c2 = figma.createFrame();
c2.name = 'ARIA table';
c2.layoutMode = 'VERTICAL';
c2.itemSpacing = 0;
c2.paddingTop = 0;
c2.paddingRight = 0;
c2.paddingBottom = 0;
c2.paddingLeft = 0;
c2.primaryAxisSizingMode = 'AUTO';
c2.counterAxisSizingMode = 'AUTO';
c2.fills = [];
var c3 = figma.createFrame();
c3.name = 'Header';
c3.layoutMode = 'HORIZONTAL';
c3.itemSpacing = 0;
c3.paddingTop = 8;
c3.paddingRight = 12;
c3.paddingBottom = 8;
c3.paddingLeft = 12;
c3.primaryAxisSizingMode = 'AUTO';
c3.counterAxisSizingMode = 'AUTO';
c3.fills = [{ type: 'SOLID', color: hexToRgb('#F5F5FA') }];
var c4 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
c4.fontName = { family: 'Inter', style: 'Bold' };
c4.fontSize = 12;
c4.characters = 'Element';
c4.fills = [{ type: 'SOLID', color: hexToRgb('#595968') }];
c4.resize(120, c4.height);
c4.textAutoResize = 'HEIGHT';
c3.appendChild(c4);
var c5 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
c5.fontName = { family: 'Inter', style: 'Bold' };
c5.fontSize = 12;
c5.characters = 'Role';
c5.fills = [{ type: 'SOLID', color: hexToRgb('#595968') }];
c5.resize(100, c5.height);
c5.textAutoResize = 'HEIGHT';
c3.appendChild(c5);
var c6 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
c6.fontName = { family: 'Inter', style: 'Bold' };
c6.fontSize = 12;
c6.characters = 'Label';
c6.fills = [{ type: 'SOLID', color: hexToRgb('#595968') }];
c6.resize(120, c6.height);
c6.textAutoResize = 'HEIGHT';
c3.appendChild(c6);
var c7 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
c7.fontName = { family: 'Inter', style: 'Bold' };
c7.fontSize = 12;
c7.characters = 'Focus Order';
c7.fills = [{ type: 'SOLID', color: hexToRgb('#595968') }];
c7.resize(80, c7.height);
c7.textAutoResize = 'HEIGHT';
c3.appendChild(c7);
var c8 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
c8.fontName = { family: 'Inter', style: 'Bold' };
c8.fontSize = 12;
c8.characters = 'Keyboard';
c8.fills = [{ type: 'SOLID', color: hexToRgb('#595968') }];
c8.resize(200, c8.height);
c8.textAutoResize = 'HEIGHT';
c3.appendChild(c8);
var c9 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
c9.fontName = { family: 'Inter', style: 'Bold' };
c9.fontSize = 12;
c9.characters = 'Announcement';
c9.fills = [{ type: 'SOLID', color: hexToRgb('#595968') }];
c9.resize(200, c9.height);
c9.textAutoResize = 'HEIGHT';
c3.appendChild(c9);
c2.appendChild(c3);
_fillH(c3);
c3.layoutSizingVertical = 'HUG';
var c10 = figma.createFrame();
c10.name = 'Row 0';
c10.layoutMode = 'HORIZONTAL';
c10.itemSpacing = 0;
c10.paddingTop = 8;
c10.paddingRight = 12;
c10.paddingBottom = 8;
c10.paddingLeft = 12;
c10.primaryAxisSizingMode = 'AUTO';
c10.counterAxisSizingMode = 'AUTO';
c10.fills = [];
var c11 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
c11.fontName = { family: 'Inter', style: 'Regular' };
c11.fontSize = 14;
c11.characters = 'Link';
c11.fills = [{ type: 'SOLID', color: hexToRgb('#1A1A2E') }];
c11.resize(120, c11.height);
c11.textAutoResize = 'HEIGHT';
c10.appendChild(c11);
var c12 = figma.createText();
await figma.loadFontAsync({ family: 'Fira Code', style: 'Regular' });
c12.fontName = { family: 'Fira Code', style: 'Regular' };
c12.fontSize = 12;
c12.characters = 'link';
c12.fills = [{ type: 'SOLID', color: hexToRgb('#1A1A2E') }];
c12.resize(100, c12.height);
c12.textAutoResize = 'HEIGHT';
c10.appendChild(c12);
var c13 = figma.createText();
await figma.loadFontAsync({ family: 'Fira Code', style: 'Regular' });
c13.fontName = { family: 'Fira Code', style: 'Regular' };
c13.fontSize = 12;
c13.characters = 'Visible text';
c13.fills = [{ type: 'SOLID', color: hexToRgb('#1A1A2E') }];
c13.resize(120, c13.height);
c13.textAutoResize = 'HEIGHT';
c10.appendChild(c13);
var c14 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
c14.fontName = { family: 'Inter', style: 'Regular' };
c14.fontSize = 14;
c14.characters = 'Tab order';
c14.fills = [{ type: 'SOLID', color: hexToRgb('#1A1A2E') }];
c14.resize(80, c14.height);
c14.textAutoResize = 'HEIGHT';
c10.appendChild(c14);
var c15 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
c15.fontName = { family: 'Inter', style: 'Regular' };
c15.fontSize = 14;
c15.characters = 'Enter to activate';
c15.fills = [{ type: 'SOLID', color: hexToRgb('#595968') }];
c15.resize(200, c15.height);
c15.textAutoResize = 'HEIGHT';
c10.appendChild(c15);
var c16 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
c16.fontName = { family: 'Inter', style: 'Regular' };
c16.fontSize = 14;
c16.characters = '[Link text], link';
c16.fills = [{ type: 'SOLID', color: hexToRgb('#595968') }];
c16.resize(200, c16.height);
c16.textAutoResize = 'HEIGHT';
c10.appendChild(c16);
c2.appendChild(c10);
_fillH(c10);
c10.layoutSizingVertical = 'HUG';
var c17 = figma.createFrame();
c17.name = 'Row 1';
c17.layoutMode = 'HORIZONTAL';
c17.itemSpacing = 0;
c17.paddingTop = 8;
c17.paddingRight = 12;
c17.paddingBottom = 8;
c17.paddingLeft = 12;
c17.primaryAxisSizingMode = 'AUTO';
c17.counterAxisSizingMode = 'AUTO';
c17.fills = [];
var c18 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
c18.fontName = { family: 'Inter', style: 'Regular' };
c18.fontSize = 14;
c18.characters = 'External link';
c18.fills = [{ type: 'SOLID', color: hexToRgb('#1A1A2E') }];
c18.resize(120, c18.height);
c18.textAutoResize = 'HEIGHT';
c17.appendChild(c18);
var c19 = figma.createText();
await figma.loadFontAsync({ family: 'Fira Code', style: 'Regular' });
c19.fontName = { family: 'Fira Code', style: 'Regular' };
c19.fontSize = 12;
c19.characters = 'link';
c19.fills = [{ type: 'SOLID', color: hexToRgb('#1A1A2E') }];
c19.resize(100, c19.height);
c19.textAutoResize = 'HEIGHT';
c17.appendChild(c19);
var c20 = figma.createText();
await figma.loadFontAsync({ family: 'Fira Code', style: 'Regular' });
c20.fontName = { family: 'Fira Code', style: 'Regular' };
c20.fontSize = 12;
c20.characters = 'aria-label with context';
c20.fills = [{ type: 'SOLID', color: hexToRgb('#1A1A2E') }];
c20.resize(120, c20.height);
c20.textAutoResize = 'HEIGHT';
c17.appendChild(c20);
var c21 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
c21.fontName = { family: 'Inter', style: 'Regular' };
c21.fontSize = 14;
c21.characters = 'Tab order';
c21.fills = [{ type: 'SOLID', color: hexToRgb('#1A1A2E') }];
c21.resize(80, c21.height);
c21.textAutoResize = 'HEIGHT';
c17.appendChild(c21);
var c22 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
c22.fontName = { family: 'Inter', style: 'Regular' };
c22.fontSize = 14;
c22.characters = 'Enter to activate';
c22.fills = [{ type: 'SOLID', color: hexToRgb('#595968') }];
c22.resize(200, c22.height);
c22.textAutoResize = 'HEIGHT';
c17.appendChild(c22);
var c23 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
c23.fontName = { family: 'Inter', style: 'Regular' };
c23.fontSize = 14;
c23.characters = '[Link text], opens in new tab, link';
c23.fills = [{ type: 'SOLID', color: hexToRgb('#595968') }];
c23.resize(200, c23.height);
c23.textAutoResize = 'HEIGHT';
c17.appendChild(c23);
c2.appendChild(c17);
_fillH(c17);
c17.layoutSizingVertical = 'HUG';
var c24 = figma.createFrame();
c24.name = 'Row 2';
c24.layoutMode = 'HORIZONTAL';
c24.itemSpacing = 0;
c24.paddingTop = 8;
c24.paddingRight = 12;
c24.paddingBottom = 8;
c24.paddingLeft = 12;
c24.primaryAxisSizingMode = 'AUTO';
c24.counterAxisSizingMode = 'AUTO';
c24.fills = [];
var c25 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
c25.fontName = { family: 'Inter', style: 'Regular' };
c25.fontSize = 14;
c25.characters = 'Disabled link';
c25.fills = [{ type: 'SOLID', color: hexToRgb('#1A1A2E') }];
c25.resize(120, c25.height);
c25.textAutoResize = 'HEIGHT';
c24.appendChild(c25);
var c26 = figma.createText();
await figma.loadFontAsync({ family: 'Fira Code', style: 'Regular' });
c26.fontName = { family: 'Fira Code', style: 'Regular' };
c26.fontSize = 12;
c26.characters = 'link';
c26.fills = [{ type: 'SOLID', color: hexToRgb('#1A1A2E') }];
c26.resize(100, c26.height);
c26.textAutoResize = 'HEIGHT';
c24.appendChild(c26);
var c27 = figma.createText();
await figma.loadFontAsync({ family: 'Fira Code', style: 'Regular' });
c27.fontName = { family: 'Fira Code', style: 'Regular' };
c27.fontSize = 12;
c27.characters = 'aria-disabled=true';
c27.fills = [{ type: 'SOLID', color: hexToRgb('#1A1A2E') }];
c27.resize(120, c27.height);
c27.textAutoResize = 'HEIGHT';
c24.appendChild(c27);
var c28 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
c28.fontName = { family: 'Inter', style: 'Regular' };
c28.fontSize = 14;
c28.characters = 'Removed (tabindex=-1)';
c28.fills = [{ type: 'SOLID', color: hexToRgb('#1A1A2E') }];
c28.resize(80, c28.height);
c28.textAutoResize = 'HEIGHT';
c24.appendChild(c28);
var c29 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
c29.fontName = { family: 'Inter', style: 'Regular' };
c29.fontSize = 14;
c29.characters = 'Not focusable';
c29.fills = [{ type: 'SOLID', color: hexToRgb('#595968') }];
c29.resize(200, c29.height);
c29.textAutoResize = 'HEIGHT';
c24.appendChild(c29);
var c30 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
c30.fontName = { family: 'Inter', style: 'Regular' };
c30.fontSize = 14;
c30.characters = '[Link text], dimmed, link';
c30.fills = [{ type: 'SOLID', color: hexToRgb('#595968') }];
c30.resize(200, c30.height);
c30.textAutoResize = 'HEIGHT';
c24.appendChild(c30);
c2.appendChild(c24);
_fillH(c24);
c24.layoutSizingVertical = 'HUG';
c0_slot.appendChild(c2);
_fillH(c2);
c2.layoutSizingVertical = 'HUG';
var c31 = figma.createRectangle();
c31.name = 'Divider';
c31.resize(300, 1);
c31.fills = [{ type: 'SOLID', color: hexToRgb('#E0E0E0') }];
c0_slot.appendChild(c31);
var c32 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });
c32.fontName = { family: 'Inter', style: 'Semi Bold' };
c32.fontSize = 16;
c32.characters = 'Contrast ratios';
c32.fills = [{ type: 'SOLID', color: hexToRgb('#1A1A2E') }];
c0_slot.appendChild(c32);
var c33 = figma.createFrame();
c33.name = 'Contrast table';
c33.layoutMode = 'VERTICAL';
c33.itemSpacing = 0;
c33.paddingTop = 0;
c33.paddingRight = 0;
c33.paddingBottom = 0;
c33.paddingLeft = 0;
c33.primaryAxisSizingMode = 'AUTO';
c33.counterAxisSizingMode = 'AUTO';
c33.fills = [];
var c34 = figma.createFrame();
c34.name = 'Header';
c34.layoutMode = 'HORIZONTAL';
c34.itemSpacing = 0;
c34.paddingTop = 8;
c34.paddingRight = 12;
c34.paddingBottom = 8;
c34.paddingLeft = 12;
c34.primaryAxisSizingMode = 'AUTO';
c34.counterAxisSizingMode = 'AUTO';
c34.fills = [{ type: 'SOLID', color: hexToRgb('#F5F5FA') }];
var c35 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
c35.fontName = { family: 'Inter', style: 'Bold' };
c35.fontSize = 12;
c35.characters = 'Element';
c35.fills = [{ type: 'SOLID', color: hexToRgb('#595968') }];
c35.resize(160, c35.height);
c35.textAutoResize = 'HEIGHT';
c34.appendChild(c35);
var c36 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
c36.fontName = { family: 'Inter', style: 'Bold' };
c36.fontSize = 12;
c36.characters = 'Foreground';
c36.fills = [{ type: 'SOLID', color: hexToRgb('#595968') }];
c36.resize(160, c36.height);
c36.textAutoResize = 'HEIGHT';
c34.appendChild(c36);
var c37 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
c37.fontName = { family: 'Inter', style: 'Bold' };
c37.fontSize = 12;
c37.characters = 'Background';
c37.fills = [{ type: 'SOLID', color: hexToRgb('#595968') }];
c37.resize(160, c37.height);
c37.textAutoResize = 'HEIGHT';
c34.appendChild(c37);
var c38 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
c38.fontName = { family: 'Inter', style: 'Bold' };
c38.fontSize = 12;
c38.characters = 'Ratio';
c38.fills = [{ type: 'SOLID', color: hexToRgb('#595968') }];
c38.resize(80, c38.height);
c38.textAutoResize = 'HEIGHT';
c34.appendChild(c38);
var c39 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
c39.fontName = { family: 'Inter', style: 'Bold' };
c39.fontSize = 12;
c39.characters = 'WCAG AA';
c39.fills = [{ type: 'SOLID', color: hexToRgb('#595968') }];
c39.resize(80, c39.height);
c39.textAutoResize = 'HEIGHT';
c34.appendChild(c39);
c33.appendChild(c34);
_fillH(c34);
c34.layoutSizingVertical = 'HUG';
var c40 = figma.createFrame();
c40.name = 'Row 0';
c40.layoutMode = 'HORIZONTAL';
c40.itemSpacing = 0;
c40.paddingTop = 8;
c40.paddingRight = 12;
c40.paddingBottom = 8;
c40.paddingLeft = 12;
c40.primaryAxisSizingMode = 'AUTO';
c40.counterAxisSizingMode = 'AUTO';
c40.fills = [];
var c41 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
c41.fontName = { family: 'Inter', style: 'Regular' };
c41.fontSize = 14;
c41.characters = 'Link text (default)';
c41.fills = [{ type: 'SOLID', color: hexToRgb('#1A1A2E') }];
c41.resize(160, c41.height);
c41.textAutoResize = 'HEIGHT';
c40.appendChild(c41);
var c42 = figma.createFrame();
c42.name = 'Cell: #0550DC';
c42.layoutMode = 'HORIZONTAL';
c42.itemSpacing = 6;
c42.paddingTop = 0;
c42.paddingRight = 0;
c42.paddingBottom = 0;
c42.paddingLeft = 0;
c42.primaryAxisSizingMode = 'AUTO';
c42.counterAxisSizingMode = 'AUTO';
c42.fills = [];
var c43 = figma.createEllipse();
c43.name = 'Swatch';
c43.resize(16, 16);
c43.fills = [{ type: 'SOLID', color: hexToRgb('#0550DC') }];
c42.appendChild(c43);
var c44 = figma.createText();
await figma.loadFontAsync({ family: 'Fira Code', style: 'Regular' });
c44.fontName = { family: 'Fira Code', style: 'Regular' };
c44.fontSize = 11;
c44.characters = '#0550DC #0550DC';
c44.fills = [{ type: 'SOLID', color: hexToRgb('#595968') }];
c42.appendChild(c44);
c40.appendChild(c42);
c42.layoutSizingHorizontal = 'HUG';
c42.layoutSizingVertical = 'HUG';
var c45 = figma.createFrame();
c45.name = 'Cell: #FFFFFF';
c45.layoutMode = 'HORIZONTAL';
c45.itemSpacing = 6;
c45.paddingTop = 0;
c45.paddingRight = 0;
c45.paddingBottom = 0;
c45.paddingLeft = 0;
c45.primaryAxisSizingMode = 'AUTO';
c45.counterAxisSizingMode = 'AUTO';
c45.fills = [];
var c46 = figma.createEllipse();
c46.name = 'Swatch';
c46.resize(16, 16);
c46.fills = [{ type: 'SOLID', color: hexToRgb('#FFFFFF') }];
c45.appendChild(c46);
var c47 = figma.createText();
await figma.loadFontAsync({ family: 'Fira Code', style: 'Regular' });
c47.fontName = { family: 'Fira Code', style: 'Regular' };
c47.fontSize = 11;
c47.characters = '#FFFFFF #FFFFFF';
c47.fills = [{ type: 'SOLID', color: hexToRgb('#595968') }];
c45.appendChild(c47);
c40.appendChild(c45);
c45.layoutSizingHorizontal = 'HUG';
c45.layoutSizingVertical = 'HUG';
var c48 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
c48.fontName = { family: 'Inter', style: 'Regular' };
c48.fontSize = 14;
c48.characters = '5.26:1';
c48.fills = [{ type: 'SOLID', color: hexToRgb('#1A1A2E') }];
c48.resize(80, c48.height);
c48.textAutoResize = 'HEIGHT';
c40.appendChild(c48);
var c49;
(function() {
  var _cs = _imp_contrastBadge;
  if (_cs.type === 'COMPONENT_SET') {
    var _variants = _cs.children;
    var _target = null;
    for (var _i = 0; _i < _variants.length; _i++) {
      if (_variants[_i].name === 'Status=Pass') { _target = _variants[_i]; break; }
    }
    if (!_target) {
      for (var _j = 0; _j < _variants.length; _j++) {
        if (_variants[_j].name.indexOf('Status=Pass') !== -1) { _target = _variants[_j]; break; }
      }
    }
    if (_target) {
      c49 = _target.createInstance();
    } else {
      c49 = (_cs.defaultVariant || _cs.children[0]).createInstance();
    }
  } else {
    c49 = _cs.createInstance();
  }
})();
c40.appendChild(c49);
c49.layoutSizingHorizontal = 'HUG';
c49.layoutSizingVertical = 'HUG';
c33.appendChild(c40);
_fillH(c40);
c40.layoutSizingVertical = 'HUG';
var c50 = figma.createFrame();
c50.name = 'Row 1';
c50.layoutMode = 'HORIZONTAL';
c50.itemSpacing = 0;
c50.paddingTop = 8;
c50.paddingRight = 12;
c50.paddingBottom = 8;
c50.paddingLeft = 12;
c50.primaryAxisSizingMode = 'AUTO';
c50.counterAxisSizingMode = 'AUTO';
c50.fills = [];
var c51 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
c51.fontName = { family: 'Inter', style: 'Regular' };
c51.fontSize = 14;
c51.characters = 'Link text (hovered)';
c51.fills = [{ type: 'SOLID', color: hexToRgb('#1A1A2E') }];
c51.resize(160, c51.height);
c51.textAutoResize = 'HEIGHT';
c50.appendChild(c51);
var c52 = figma.createFrame();
c52.name = 'Cell: #0343B5';
c52.layoutMode = 'HORIZONTAL';
c52.itemSpacing = 6;
c52.paddingTop = 0;
c52.paddingRight = 0;
c52.paddingBottom = 0;
c52.paddingLeft = 0;
c52.primaryAxisSizingMode = 'AUTO';
c52.counterAxisSizingMode = 'AUTO';
c52.fills = [];
var c53 = figma.createEllipse();
c53.name = 'Swatch';
c53.resize(16, 16);
c53.fills = [{ type: 'SOLID', color: hexToRgb('#0343B5') }];
c52.appendChild(c53);
var c54 = figma.createText();
await figma.loadFontAsync({ family: 'Fira Code', style: 'Regular' });
c54.fontName = { family: 'Fira Code', style: 'Regular' };
c54.fontSize = 11;
c54.characters = '#0343B5 #0343B5';
c54.fills = [{ type: 'SOLID', color: hexToRgb('#595968') }];
c52.appendChild(c54);
c50.appendChild(c52);
c52.layoutSizingHorizontal = 'HUG';
c52.layoutSizingVertical = 'HUG';
var c55 = figma.createFrame();
c55.name = 'Cell: #FFFFFF';
c55.layoutMode = 'HORIZONTAL';
c55.itemSpacing = 6;
c55.paddingTop = 0;
c55.paddingRight = 0;
c55.paddingBottom = 0;
c55.paddingLeft = 0;
c55.primaryAxisSizingMode = 'AUTO';
c55.counterAxisSizingMode = 'AUTO';
c55.fills = [];
var c56 = figma.createEllipse();
c56.name = 'Swatch';
c56.resize(16, 16);
c56.fills = [{ type: 'SOLID', color: hexToRgb('#FFFFFF') }];
c55.appendChild(c56);
var c57 = figma.createText();
await figma.loadFontAsync({ family: 'Fira Code', style: 'Regular' });
c57.fontName = { family: 'Fira Code', style: 'Regular' };
c57.fontSize = 11;
c57.characters = '#FFFFFF #FFFFFF';
c57.fills = [{ type: 'SOLID', color: hexToRgb('#595968') }];
c55.appendChild(c57);
c50.appendChild(c55);
c55.layoutSizingHorizontal = 'HUG';
c55.layoutSizingVertical = 'HUG';
var c58 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
c58.fontName = { family: 'Inter', style: 'Regular' };
c58.fontSize = 14;
c58.characters = '6.82:1';
c58.fills = [{ type: 'SOLID', color: hexToRgb('#1A1A2E') }];
c58.resize(80, c58.height);
c58.textAutoResize = 'HEIGHT';
c50.appendChild(c58);
var c59;
(function() {
  var _cs = _imp_contrastBadge;
  if (_cs.type === 'COMPONENT_SET') {
    var _variants = _cs.children;
    var _target = null;
    for (var _i = 0; _i < _variants.length; _i++) {
      if (_variants[_i].name === 'Status=Pass') { _target = _variants[_i]; break; }
    }
    if (!_target) {
      for (var _j = 0; _j < _variants.length; _j++) {
        if (_variants[_j].name.indexOf('Status=Pass') !== -1) { _target = _variants[_j]; break; }
      }
    }
    if (_target) {
      c59 = _target.createInstance();
    } else {
      c59 = (_cs.defaultVariant || _cs.children[0]).createInstance();
    }
  } else {
    c59 = _cs.createInstance();
  }
})();
c50.appendChild(c59);
c59.layoutSizingHorizontal = 'HUG';
c59.layoutSizingVertical = 'HUG';
c33.appendChild(c50);
_fillH(c50);
c50.layoutSizingVertical = 'HUG';
var c60 = figma.createFrame();
c60.name = 'Row 2';
c60.layoutMode = 'HORIZONTAL';
c60.itemSpacing = 0;
c60.paddingTop = 8;
c60.paddingRight = 12;
c60.paddingBottom = 8;
c60.paddingLeft = 12;
c60.primaryAxisSizingMode = 'AUTO';
c60.counterAxisSizingMode = 'AUTO';
c60.fills = [];
var c61 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
c61.fontName = { family: 'Inter', style: 'Regular' };
c61.fontSize = 14;
c61.characters = 'Link text (pressed)';
c61.fills = [{ type: 'SOLID', color: hexToRgb('#1A1A2E') }];
c61.resize(160, c61.height);
c61.textAutoResize = 'HEIGHT';
c60.appendChild(c61);
var c62 = figma.createFrame();
c62.name = 'Cell: #023699';
c62.layoutMode = 'HORIZONTAL';
c62.itemSpacing = 6;
c62.paddingTop = 0;
c62.paddingRight = 0;
c62.paddingBottom = 0;
c62.paddingLeft = 0;
c62.primaryAxisSizingMode = 'AUTO';
c62.counterAxisSizingMode = 'AUTO';
c62.fills = [];
var c63 = figma.createEllipse();
c63.name = 'Swatch';
c63.resize(16, 16);
c63.fills = [{ type: 'SOLID', color: hexToRgb('#023699') }];
c62.appendChild(c63);
var c64 = figma.createText();
await figma.loadFontAsync({ family: 'Fira Code', style: 'Regular' });
c64.fontName = { family: 'Fira Code', style: 'Regular' };
c64.fontSize = 11;
c64.characters = '#023699 #023699';
c64.fills = [{ type: 'SOLID', color: hexToRgb('#595968') }];
c62.appendChild(c64);
c60.appendChild(c62);
c62.layoutSizingHorizontal = 'HUG';
c62.layoutSizingVertical = 'HUG';
var c65 = figma.createFrame();
c65.name = 'Cell: #FFFFFF';
c65.layoutMode = 'HORIZONTAL';
c65.itemSpacing = 6;
c65.paddingTop = 0;
c65.paddingRight = 0;
c65.paddingBottom = 0;
c65.paddingLeft = 0;
c65.primaryAxisSizingMode = 'AUTO';
c65.counterAxisSizingMode = 'AUTO';
c65.fills = [];
var c66 = figma.createEllipse();
c66.name = 'Swatch';
c66.resize(16, 16);
c66.fills = [{ type: 'SOLID', color: hexToRgb('#FFFFFF') }];
c65.appendChild(c66);
var c67 = figma.createText();
await figma.loadFontAsync({ family: 'Fira Code', style: 'Regular' });
c67.fontName = { family: 'Fira Code', style: 'Regular' };
c67.fontSize = 11;
c67.characters = '#FFFFFF #FFFFFF';
c67.fills = [{ type: 'SOLID', color: hexToRgb('#595968') }];
c65.appendChild(c67);
c60.appendChild(c65);
c65.layoutSizingHorizontal = 'HUG';
c65.layoutSizingVertical = 'HUG';
var c68 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
c68.fontName = { family: 'Inter', style: 'Regular' };
c68.fontSize = 14;
c68.characters = '8.63:1';
c68.fills = [{ type: 'SOLID', color: hexToRgb('#1A1A2E') }];
c68.resize(80, c68.height);
c68.textAutoResize = 'HEIGHT';
c60.appendChild(c68);
var c69;
(function() {
  var _cs = _imp_contrastBadge;
  if (_cs.type === 'COMPONENT_SET') {
    var _variants = _cs.children;
    var _target = null;
    for (var _i = 0; _i < _variants.length; _i++) {
      if (_variants[_i].name === 'Status=Pass') { _target = _variants[_i]; break; }
    }
    if (!_target) {
      for (var _j = 0; _j < _variants.length; _j++) {
        if (_variants[_j].name.indexOf('Status=Pass') !== -1) { _target = _variants[_j]; break; }
      }
    }
    if (_target) {
      c69 = _target.createInstance();
    } else {
      c69 = (_cs.defaultVariant || _cs.children[0]).createInstance();
    }
  } else {
    c69 = _cs.createInstance();
  }
})();
c60.appendChild(c69);
c69.layoutSizingHorizontal = 'HUG';
c69.layoutSizingVertical = 'HUG';
c33.appendChild(c60);
_fillH(c60);
c60.layoutSizingVertical = 'HUG';
var c70 = figma.createFrame();
c70.name = 'Row 3';
c70.layoutMode = 'HORIZONTAL';
c70.itemSpacing = 0;
c70.paddingTop = 8;
c70.paddingRight = 12;
c70.paddingBottom = 8;
c70.paddingLeft = 12;
c70.primaryAxisSizingMode = 'AUTO';
c70.counterAxisSizingMode = 'AUTO';
c70.fills = [];
var c71 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
c71.fontName = { family: 'Inter', style: 'Regular' };
c71.fontSize = 14;
c71.characters = 'Disabled text';
c71.fills = [{ type: 'SOLID', color: hexToRgb('#1A1A2E') }];
c71.resize(160, c71.height);
c71.textAutoResize = 'HEIGHT';
c70.appendChild(c71);
var c72 = figma.createFrame();
c72.name = 'Cell: #9898A7';
c72.layoutMode = 'HORIZONTAL';
c72.itemSpacing = 6;
c72.paddingTop = 0;
c72.paddingRight = 0;
c72.paddingBottom = 0;
c72.paddingLeft = 0;
c72.primaryAxisSizingMode = 'AUTO';
c72.counterAxisSizingMode = 'AUTO';
c72.fills = [];
var c73 = figma.createEllipse();
c73.name = 'Swatch';
c73.resize(16, 16);
c73.fills = [{ type: 'SOLID', color: hexToRgb('#9898A7') }];
c72.appendChild(c73);
var c74 = figma.createText();
await figma.loadFontAsync({ family: 'Fira Code', style: 'Regular' });
c74.fontName = { family: 'Fira Code', style: 'Regular' };
c74.fontSize = 11;
c74.characters = '#9898A7 #9898A7';
c74.fills = [{ type: 'SOLID', color: hexToRgb('#595968') }];
c72.appendChild(c74);
c70.appendChild(c72);
c72.layoutSizingHorizontal = 'HUG';
c72.layoutSizingVertical = 'HUG';
var c75 = figma.createFrame();
c75.name = 'Cell: #FFFFFF';
c75.layoutMode = 'HORIZONTAL';
c75.itemSpacing = 6;
c75.paddingTop = 0;
c75.paddingRight = 0;
c75.paddingBottom = 0;
c75.paddingLeft = 0;
c75.primaryAxisSizingMode = 'AUTO';
c75.counterAxisSizingMode = 'AUTO';
c75.fills = [];
var c76 = figma.createEllipse();
c76.name = 'Swatch';
c76.resize(16, 16);
c76.fills = [{ type: 'SOLID', color: hexToRgb('#FFFFFF') }];
c75.appendChild(c76);
var c77 = figma.createText();
await figma.loadFontAsync({ family: 'Fira Code', style: 'Regular' });
c77.fontName = { family: 'Fira Code', style: 'Regular' };
c77.fontSize = 11;
c77.characters = '#FFFFFF #FFFFFF';
c77.fills = [{ type: 'SOLID', color: hexToRgb('#595968') }];
c75.appendChild(c77);
c70.appendChild(c75);
c75.layoutSizingHorizontal = 'HUG';
c75.layoutSizingVertical = 'HUG';
var c78 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
c78.fontName = { family: 'Inter', style: 'Regular' };
c78.fontSize = 14;
c78.characters = '3.01:1';
c78.fills = [{ type: 'SOLID', color: hexToRgb('#1A1A2E') }];
c78.resize(80, c78.height);
c78.textAutoResize = 'HEIGHT';
c70.appendChild(c78);
var c79;
(function() {
  var _cs = _imp_contrastBadge;
  if (_cs.type === 'COMPONENT_SET') {
    var _variants = _cs.children;
    var _target = null;
    for (var _i = 0; _i < _variants.length; _i++) {
      if (_variants[_i].name === 'Status=Exempt') { _target = _variants[_i]; break; }
    }
    if (!_target) {
      for (var _j = 0; _j < _variants.length; _j++) {
        if (_variants[_j].name.indexOf('Status=Exempt') !== -1) { _target = _variants[_j]; break; }
      }
    }
    if (_target) {
      c79 = _target.createInstance();
    } else {
      c79 = (_cs.defaultVariant || _cs.children[0]).createInstance();
    }
  } else {
    c79 = _cs.createInstance();
  }
})();
c70.appendChild(c79);
c79.layoutSizingHorizontal = 'HUG';
c79.layoutSizingVertical = 'HUG';
c33.appendChild(c70);
_fillH(c70);
c70.layoutSizingVertical = 'HUG';
var c80 = figma.createFrame();
c80.name = 'Row 4';
c80.layoutMode = 'HORIZONTAL';
c80.itemSpacing = 0;
c80.paddingTop = 8;
c80.paddingRight = 12;
c80.paddingBottom = 8;
c80.paddingLeft = 12;
c80.primaryAxisSizingMode = 'AUTO';
c80.counterAxisSizingMode = 'AUTO';
c80.fills = [];
var c81 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
c81.fontName = { family: 'Inter', style: 'Regular' };
c81.fontSize = 14;
c81.characters = 'Link vs body text';
c81.fills = [{ type: 'SOLID', color: hexToRgb('#1A1A2E') }];
c81.resize(160, c81.height);
c81.textAutoResize = 'HEIGHT';
c80.appendChild(c81);
var c82 = figma.createFrame();
c82.name = 'Cell: #0550DC';
c82.layoutMode = 'HORIZONTAL';
c82.itemSpacing = 6;
c82.paddingTop = 0;
c82.paddingRight = 0;
c82.paddingBottom = 0;
c82.paddingLeft = 0;
c82.primaryAxisSizingMode = 'AUTO';
c82.counterAxisSizingMode = 'AUTO';
c82.fills = [];
var c83 = figma.createEllipse();
c83.name = 'Swatch';
c83.resize(16, 16);
c83.fills = [{ type: 'SOLID', color: hexToRgb('#0550DC') }];
c82.appendChild(c83);
var c84 = figma.createText();
await figma.loadFontAsync({ family: 'Fira Code', style: 'Regular' });
c84.fontName = { family: 'Fira Code', style: 'Regular' };
c84.fontSize = 11;
c84.characters = '#0550DC #0550DC';
c84.fills = [{ type: 'SOLID', color: hexToRgb('#595968') }];
c82.appendChild(c84);
c80.appendChild(c82);
c82.layoutSizingHorizontal = 'HUG';
c82.layoutSizingVertical = 'HUG';
var c85 = figma.createFrame();
c85.name = 'Cell: #1A1A2E';
c85.layoutMode = 'HORIZONTAL';
c85.itemSpacing = 6;
c85.paddingTop = 0;
c85.paddingRight = 0;
c85.paddingBottom = 0;
c85.paddingLeft = 0;
c85.primaryAxisSizingMode = 'AUTO';
c85.counterAxisSizingMode = 'AUTO';
c85.fills = [];
var c86 = figma.createEllipse();
c86.name = 'Swatch';
c86.resize(16, 16);
c86.fills = [{ type: 'SOLID', color: hexToRgb('#1A1A2E') }];
c85.appendChild(c86);
var c87 = figma.createText();
await figma.loadFontAsync({ family: 'Fira Code', style: 'Regular' });
c87.fontName = { family: 'Fira Code', style: 'Regular' };
c87.fontSize = 11;
c87.characters = '#1A1A2E #1A1A2E';
c87.fills = [{ type: 'SOLID', color: hexToRgb('#595968') }];
c85.appendChild(c87);
c80.appendChild(c85);
c85.layoutSizingHorizontal = 'HUG';
c85.layoutSizingVertical = 'HUG';
var c88 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
c88.fontName = { family: 'Inter', style: 'Regular' };
c88.fontSize = 14;
c88.characters = '3.24:1';
c88.fills = [{ type: 'SOLID', color: hexToRgb('#1A1A2E') }];
c88.resize(80, c88.height);
c88.textAutoResize = 'HEIGHT';
c80.appendChild(c88);
var c89;
(function() {
  var _cs = _imp_contrastBadge;
  if (_cs.type === 'COMPONENT_SET') {
    var _variants = _cs.children;
    var _target = null;
    for (var _i = 0; _i < _variants.length; _i++) {
      if (_variants[_i].name === 'Status=Pass (3:1)') { _target = _variants[_i]; break; }
    }
    if (!_target) {
      for (var _j = 0; _j < _variants.length; _j++) {
        if (_variants[_j].name.indexOf('Status=Pass (3:1)') !== -1) { _target = _variants[_j]; break; }
      }
    }
    if (_target) {
      c89 = _target.createInstance();
    } else {
      c89 = (_cs.defaultVariant || _cs.children[0]).createInstance();
    }
  } else {
    c89 = _cs.createInstance();
  }
})();
c80.appendChild(c89);
c89.layoutSizingHorizontal = 'HUG';
c89.layoutSizingVertical = 'HUG';
c33.appendChild(c80);
_fillH(c80);
c80.layoutSizingVertical = 'HUG';
c0_slot.appendChild(c33);
_fillH(c33);
c33.layoutSizingVertical = 'HUG';
_wrapper.appendChild(c0);
_nodeCount++;

// Tag with plugin data
_wrapper.setSharedPluginData('actian_ds', 'skill', 'component-brief');
_wrapper.setSharedPluginData('actian_ds', 'pushed_at', new Date().toISOString());

// Return metadata
return { wrapperId: _wrapper.id, nodeCount: _nodeCount };