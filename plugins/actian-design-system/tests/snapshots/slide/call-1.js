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
var _targetNode = await figma.getNodeByIdAsync('0:0');
var _page = _targetNode;
while (_page && _page.type !== 'PAGE') _page = _page.parent;
if (_page) await figma.setCurrentPageAsync(_page);

// Load fonts
await Promise.all([
  figma.loadFontAsync({ family: 'Roboto', style: 'Regular' }),
  figma.loadFontAsync({ family: 'Roboto', style: 'Bold' }),
  figma.loadFontAsync({ family: 'Roboto', style: 'Medium' }),
]);

// Import components
var _imp_genLog = await figma.importComponentByKeyAsync('a9653f30925367e96dea90093d750bfe70849571');
var _imp_slideCover = await figma.importComponentByKeyAsync('a12f6f0b26fffc59fdac49df2bc3c36182c912da');
var _imp_slideBodyFull = await figma.importComponentByKeyAsync('281e7a9bc55abe69bb2364e639f7511b4a005694');
var _imp_slideBodyTV = await figma.importComponentByKeyAsync('28ea7a37752149d78679847ec7893368a4c4f1a0');
var _imp_slideSection = await figma.importComponentByKeyAsync('348efaa22a6da818c435017399a357b47257bcdc');
var _imp_slideBack = await figma.importComponentByKeyAsync('6df533ae800a6596fd84e93a2e5fc725dbd6a369');

// Import variables
var _var_bgDefault = await figma.variables.importVariableByKeyAsync('805afec875092b89deebe685e17992963d603974');
var _var_textPrimary = await figma.variables.importVariableByKeyAsync('cb3cf6a8b661f3a2ff12835120957f3278d329d0');
var _var_bgGrey2 = await figma.variables.importVariableByKeyAsync('2d7f893d1d1f5807dfc84b7b6e057eff8fd2ae31');
var _var_textSecondary = await figma.variables.importVariableByKeyAsync('54d9d36f7653380d99e9aadbad21e14f9dcdb295');
var _var_textReverse = await figma.variables.importVariableByKeyAsync('d5b2b08fd5bab41595edb892bf4707cb94bae50a');
var _var_brandPrimary = await figma.variables.importVariableByKeyAsync('a256595115f6048a1e1c843e3099a79a5c259288');
var _var_borderDefault = await figma.variables.importVariableByKeyAsync('290c868621027b488cbc3b262619959bec52765f');

// Create or find wrapper
var _wrapper = figma.createFrame();
_wrapper.name = 'Presentation: Actian Design System 2026';
_wrapper.layoutMode = 'HORIZONTAL';
_wrapper.itemSpacing = 32;
_wrapper.primaryAxisSizingMode = 'AUTO';
_wrapper.counterAxisSizingMode = 'AUTO';
_wrapper.fills = [];

// Build tree
var _nodeCount = 0;
var c0;
(function() {
  var _cs = _imp_genLog;
  if (_cs.type === 'COMPONENT_SET') {
    c0 = (_cs.defaultVariant || _cs.children[0]).createInstance();
  } else {
    c0 = _cs.createInstance();
  }
})();
c0.name = 'Generation Log';
setProp(c0, 'Skill', 'generate-presentation');
setProp(c0, 'Prompt', 'Create a presentation about the DS 2026 update');
setProp(c0, 'Date', '2026-04-03T00:00:00Z');
setProp(c0, 'Duration', '25s');
setProp(c0, 'Model', 'claude-opus-4-6');
setProp(c0, 'Plugin', '1.31.0');
_wrapper.appendChild(c0);
_nodeCount++;
var c1;
(function() {
  var _cs = _imp_slideCover;
  if (_cs.type === 'COMPONENT_SET') {
    c1 = (_cs.defaultVariant || _cs.children[0]).createInstance();
  } else {
    c1 = _cs.createInstance();
  }
})();
c1.name = 'Slide: Cover';
setProp(c1, 'Topic', 'Design System');
setProp(c1, 'Title', 'Actian Design System 2026');
setProp(c1, 'Subtitle', 'Tokens, components, and guidelines for consistent product experiences');
setProp(c1, 'Date', 'April 2026');
setProp(c1, 'Creators', 'UX Team');
_wrapper.appendChild(c1);
_nodeCount++;
var c2;
(function() {
  var _cs = _imp_slideSection;
  if (_cs.type === 'COMPONENT_SET') {
    c2 = (_cs.defaultVariant || _cs.children[0]).createInstance();
  } else {
    c2 = _cs.createInstance();
  }
})();
c2.name = 'Slide: Section — Foundation';
setProp(c2, 'Topic', '');
setProp(c2, 'Title', 'Foundation');
_wrapper.appendChild(c2);
_nodeCount++;
var c3 = figma.createFrame();
c3.name = 'Slide: Token architecture';
c3.layoutMode = 'VERTICAL';
c3.itemSpacing = 24;
c3.paddingTop = 64;
c3.paddingRight = 80;
c3.paddingBottom = 64;
c3.paddingLeft = 80;
c3.primaryAxisSizingMode = 'AUTO';
c3.counterAxisSizingMode = 'AUTO';
c3.fills = [{ type: 'SOLID', color: hexToRgb('#FFFFFF') }];
c3.clipsContent = true;
c3.resize(1920, 1080);
var c4 = figma.createText();
c4.name = 'Title';
await figma.loadFontAsync({ family: 'Roboto', style: 'Regular' });
c4.fontName = { family: 'Roboto', style: 'Regular' };
c4.fontSize = 56;
c4.characters = 'Token architecture';
c4.fills = [{ type: 'SOLID', color: hexToRgb('#12131F') }];
c4.lineHeight = { value: 103, unit: 'PIXELS' };
c3.appendChild(c4);
_fillH(c4);
c4.layoutSizingVertical = 'HUG';
_wrapper.appendChild(c3);
_nodeCount++;
var c5 = figma.createFrame();
c5.name = 'Slide: Spacing scale';
c5.layoutMode = 'VERTICAL';
c5.itemSpacing = 0;
c5.paddingTop = 64;
c5.paddingRight = 80;
c5.paddingBottom = 64;
c5.paddingLeft = 80;
c5.primaryAxisSizingMode = 'AUTO';
c5.counterAxisSizingMode = 'AUTO';
c5.fills = [{ type: 'SOLID', color: hexToRgb('#FFFFFF') }];
c5.clipsContent = true;
c5.resize(1920, 1080);
var c6 = figma.createText();
c6.name = 'Title';
await figma.loadFontAsync({ family: 'Roboto', style: 'Regular' });
c6.fontName = { family: 'Roboto', style: 'Regular' };
c6.fontSize = 56;
c6.characters = 'Spacing scale';
c6.fills = [{ type: 'SOLID', color: hexToRgb('#12131F') }];
c6.lineHeight = { value: 103, unit: 'PIXELS' };
c5.appendChild(c6);
_fillH(c6);
c6.layoutSizingVertical = 'HUG';
var c7 = figma.createFrame();
c7.name = 'Content columns';
c7.layoutMode = 'HORIZONTAL';
c7.itemSpacing = 56;
c7.primaryAxisSizingMode = 'AUTO';
c7.counterAxisSizingMode = 'AUTO';
c7.fills = [];
var c8 = figma.createFrame();
c8.name = 'Text column';
c8.layoutMode = 'VERTICAL';
c8.itemSpacing = 16;
c8.primaryAxisSizingMode = 'AUTO';
c8.counterAxisSizingMode = 'AUTO';
c8.fills = [];
var c9 = figma.createText();
c9.name = 'Body';
await figma.loadFontAsync({ family: 'Roboto', style: 'Regular' });
c9.fontName = { family: 'Roboto', style: 'Regular' };
c9.fontSize = 24;
c9.characters = 'Eight-point grid with 7 named steps. Used consistently across all components and layouts.';
c9.fills = [{ type: 'SOLID', color: hexToRgb('#000000') }];
c9.resize(549, c9.height);
c9.textAutoResize = 'HEIGHT';
c9.lineHeight = { value: 130, unit: 'PIXELS' };
c8.appendChild(c9);
c7.appendChild(c8);
c8.layoutSizingHorizontal = 'FIXED';
c8.resize(549, c8.height);
_fillV(c8);
var c10 = figma.createFrame();
c10.name = 'Visual area';
c10.layoutMode = 'VERTICAL';
c10.itemSpacing = 0;
c10.paddingTop = 24;
c10.paddingRight = 24;
c10.paddingBottom = 24;
c10.paddingLeft = 24;
c10.primaryAxisAlignItems = 'CENTER';
c10.counterAxisAlignItems = 'CENTER';
c10.primaryAxisSizingMode = 'AUTO';
c10.counterAxisSizingMode = 'AUTO';
c10.fills = [{ type: 'SOLID', color: hexToRgb('#F5F5FA') }];
c10.cornerRadius = 4;
c7.appendChild(c10);
_fillH(c10);
_fillV(c10);
c5.appendChild(c7);
_fillH(c7);
_fillV(c7);
_wrapper.appendChild(c5);
_nodeCount++;
var c11;
(function() {
  var _cs = _imp_slideBack;
  if (_cs.type === 'COMPONENT_SET') {
    c11 = (_cs.defaultVariant || _cs.children[0]).createInstance();
  } else {
    c11 = _cs.createInstance();
  }
})();
c11.name = 'Slide: Back cover';
setProp(c11, 'Title', 'Thank you');
_wrapper.appendChild(c11);
_nodeCount++;

// Create container frame and position below existing content
var _section = figma.createFrame();
_section.name = 'Presentation: Actian Design System 2026';
_section.layoutMode = 'VERTICAL';
_section.primaryAxisSizingMode = 'AUTO';
_section.counterAxisSizingMode = 'AUTO';
_section.fills = [];
_section.appendChild(_wrapper);
var _parentPage = _targetNode && _targetNode.type === 'PAGE' ? _targetNode : figma.currentPage;
var _maxBottom = 0;
var _pageChildren = _parentPage.children;
for (var _p = 0; _p < _pageChildren.length; _p++) {
  var _existing = _pageChildren[_p];
  if (_existing.id === _section.id) continue;
  var _ey = typeof _existing.y === 'number' && isFinite(_existing.y) ? _existing.y : 0;
  var _eh = typeof _existing.height === 'number' && isFinite(_existing.height) ? _existing.height : 0;
  var _bottom = _ey + _eh;
  if (_bottom > _maxBottom) _maxBottom = _bottom;
}
_section.x = 0;
_section.y = _maxBottom + 200;

// Tag with plugin data
_wrapper.setSharedPluginData('actian_ds', 'skill', 'generate-presentation');
_wrapper.setSharedPluginData('actian_ds', 'pushed_at', new Date().toISOString());

// Return metadata
return { wrapperId: _wrapper.id, nodeCount: _nodeCount, sectionId: _section.id };