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
  figma.loadFontAsync({ family: 'Inter', style: 'Regular' }),
  figma.loadFontAsync({ family: 'Inter', style: 'Medium' }),
  figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' }),
  figma.loadFontAsync({ family: 'Inter', style: 'Bold' }),
]);

// Import components
var _imp_genLog = await figma.importComponentByKeyAsync('a9653f30925367e96dea90093d750bfe70849571');
var _imp_flowCoverCard = await figma.importComponentByKeyAsync('eaebde6bd07d2f19f3f9c00a9587240cb085a90d');
var _imp_fmAppHeader = await figma.importComponentSetByKeyAsync('8fc9bcee610c7f8d22ebcc268467993f6dc99c87');
var _imp_fmSideNavItem = await figma.importComponentSetByKeyAsync('d18a0a772ed4acd760c497cb93de796ff052a7b4');
var _imp_fmPageHeader = await figma.importComponentSetByKeyAsync('ae1f8684a4a89aa74463d439e4e8c1e7a48137fe');
var _imp_fmTableCell = await figma.importComponentSetByKeyAsync('9267fecfadc4577563deb1425fa598d1f5af9144');

// Create or find wrapper
var _wrapper = figma.createFrame();
_wrapper.name = 'generate-flow: Connection settings';
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
setProp(c0, 'Skill', 'Skill: generate-flow');
setProp(c0, 'Prompt', 'Prompt: Design a connection settings page in Studio');
setProp(c0, 'Date', '2026-04-03T00:00:00Z');
setProp(c0, 'Duration', 'Duration: 30s');
setProp(c0, 'Model', 'claude-opus-4-6');
setProp(c0, 'Plugin Version', 'v1.31.0');
_wrapper.appendChild(c0);
c0.layoutSizingHorizontal = 'HUG';
c0.layoutSizingVertical = 'HUG';
_nodeCount++;
var c1;
(function() {
  var _cs = _imp_flowCoverCard;
  if (_cs.type === 'COMPONENT_SET') {
    c1 = (_cs.defaultVariant || _cs.children[0]).createInstance();
  } else {
    c1 = _cs.createInstance();
  }
})();
c1.name = 'Cover: Connection settings';
setProp(c1, 'Feature', 'Connection settings');
setProp(c1, 'Flow', 'User configures a database connection in Studio');
setProp(c1, 'User', 'Data engineer');
_wrapper.appendChild(c1);
_nodeCount++;
var c2 = figma.createFrame();
c2.name = 'Connections list';
c2.layoutMode = 'VERTICAL';
c2.itemSpacing = 0;
c2.primaryAxisSizingMode = 'AUTO';
c2.counterAxisSizingMode = 'AUTO';
c2.fills = [{ type: 'SOLID', color: hexToRgb('#FFFFFF') }];
c2.clipsContent = true;
c2.resize(1440, 960);
var c3;
(function() {
  var _cs = _imp_fmAppHeader;
  if (_cs.type === 'COMPONENT_SET') {
    var _variants = _cs.children;
    var _target = null;
    for (var _i = 0; _i < _variants.length; _i++) {
      if (_variants[_i].name === 'Type=Studio') { _target = _variants[_i]; break; }
    }
    if (!_target) {
      for (var _j = 0; _j < _variants.length; _j++) {
        if (_variants[_j].name.indexOf('Type=Studio') !== -1) { _target = _variants[_j]; break; }
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
c3.name = 'App Header';
c2.appendChild(c3);
var c4 = figma.createFrame();
c4.name = 'Body';
c4.layoutMode = 'HORIZONTAL';
c4.itemSpacing = 0;
c4.primaryAxisSizingMode = 'AUTO';
c4.counterAxisSizingMode = 'AUTO';
c4.fills = [];
c4.resize(1440, 890);
var c5 = figma.createFrame();
c5.name = 'Sidebar';
c5.layoutMode = 'VERTICAL';
c5.itemSpacing = 0;
c5.paddingTop = 28;
c5.paddingRight = 16;
c5.paddingBottom = 8;
c5.paddingLeft = 16;
c5.primaryAxisSizingMode = 'AUTO';
c5.counterAxisSizingMode = 'AUTO';
c5.fills = [{ type: 'SOLID', color: hexToRgb('#FFFFFF') }];
c5.resize(260, 890);
var c6;
(function() {
  var _cs = _imp_fmSideNavItem;
  if (_cs.type === 'COMPONENT_SET') {
    var _variants = _cs.children;
    var _target = null;
    for (var _i = 0; _i < _variants.length; _i++) {
      if (_variants[_i].name === 'State=On') { _target = _variants[_i]; break; }
    }
    if (!_target) {
      for (var _j = 0; _j < _variants.length; _j++) {
        if (_variants[_j].name.indexOf('State=On') !== -1) { _target = _variants[_j]; break; }
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
c6.name = 'Nav: Home';
setProp(c6, 'Label', 'Home');
c5.appendChild(c6);
var c7;
(function() {
  var _cs = _imp_fmSideNavItem;
  if (_cs.type === 'COMPONENT_SET') {
    var _variants = _cs.children;
    var _target = null;
    for (var _i = 0; _i < _variants.length; _i++) {
      if (_variants[_i].name === 'State=Placeholder') { _target = _variants[_i]; break; }
    }
    if (!_target) {
      for (var _j = 0; _j < _variants.length; _j++) {
        if (_variants[_j].name.indexOf('State=Placeholder') !== -1) { _target = _variants[_j]; break; }
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
c7.name = 'Nav: Placeholder 1';
c5.appendChild(c7);
var c8;
(function() {
  var _cs = _imp_fmSideNavItem;
  if (_cs.type === 'COMPONENT_SET') {
    var _variants = _cs.children;
    var _target = null;
    for (var _i = 0; _i < _variants.length; _i++) {
      if (_variants[_i].name === 'State=Placeholder') { _target = _variants[_i]; break; }
    }
    if (!_target) {
      for (var _j = 0; _j < _variants.length; _j++) {
        if (_variants[_j].name.indexOf('State=Placeholder') !== -1) { _target = _variants[_j]; break; }
      }
    }
    if (_target) {
      c8 = _target.createInstance();
    } else {
      c8 = (_cs.defaultVariant || _cs.children[0]).createInstance();
    }
  } else {
    c8 = _cs.createInstance();
  }
})();
c8.name = 'Nav: Placeholder 2';
c5.appendChild(c8);
var c9;
(function() {
  var _cs = _imp_fmSideNavItem;
  if (_cs.type === 'COMPONENT_SET') {
    var _variants = _cs.children;
    var _target = null;
    for (var _i = 0; _i < _variants.length; _i++) {
      if (_variants[_i].name === 'State=Placeholder') { _target = _variants[_i]; break; }
    }
    if (!_target) {
      for (var _j = 0; _j < _variants.length; _j++) {
        if (_variants[_j].name.indexOf('State=Placeholder') !== -1) { _target = _variants[_j]; break; }
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
c9.name = 'Nav: Placeholder 3';
c5.appendChild(c9);
c4.appendChild(c5);
var c10 = figma.createFrame();
c10.name = 'Content Area';
c10.layoutMode = 'VERTICAL';
c10.itemSpacing = 16;
c10.paddingTop = 24;
c10.paddingRight = 32;
c10.paddingBottom = 24;
c10.paddingLeft = 32;
c10.primaryAxisSizingMode = 'AUTO';
c10.counterAxisSizingMode = 'AUTO';
c10.fills = [{ type: 'SOLID', color: hexToRgb('#F5F5FA') }];
c10.resize(1180, 890);
var c11;
(function() {
  var _cs = _imp_fmPageHeader;
  if (_cs.type === 'COMPONENT_SET') {
    var _variants = _cs.children;
    var _target = null;
    for (var _i = 0; _i < _variants.length; _i++) {
      if (_variants[_i].name === 'Type=Title + Actions') { _target = _variants[_i]; break; }
    }
    if (!_target) {
      for (var _j = 0; _j < _variants.length; _j++) {
        if (_variants[_j].name.indexOf('Type=Title + Actions') !== -1) { _target = _variants[_j]; break; }
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
c11.name = 'Page Header';
setProp(c11, 'Title', 'Connections');
setProp(c11, 'Subtitle', 'Manage database and API connections');
c10.appendChild(c11);
var c12 = figma.createFrame();
c12.name = 'Connections table';
c12.layoutMode = 'VERTICAL';
c12.itemSpacing = 0;
c12.paddingTop = 0;
c12.paddingRight = 0;
c12.paddingBottom = 0;
c12.paddingLeft = 0;
c12.primaryAxisSizingMode = 'AUTO';
c12.counterAxisSizingMode = 'AUTO';
c12.fills = [];
var c13;
(function() {
  var _cs = _imp_fmTableCell;
  if (_cs.type === 'COMPONENT_SET') {
    var _variants = _cs.children;
    var _target = null;
    for (var _i = 0; _i < _variants.length; _i++) {
      if (_variants[_i].name === 'Type=Header') { _target = _variants[_i]; break; }
    }
    if (!_target) {
      for (var _j = 0; _j < _variants.length; _j++) {
        if (_variants[_j].name.indexOf('Type=Header') !== -1) { _target = _variants[_j]; break; }
      }
    }
    if (_target) {
      c13 = _target.createInstance();
    } else {
      c13 = (_cs.defaultVariant || _cs.children[0]).createInstance();
    }
  } else {
    c13 = _cs.createInstance();
  }
})();
setProp(c13, 'Label', 'Name');
setProp(c13, 'Label 2', 'Type');
setProp(c13, 'Label 3', 'Status');
setProp(c13, 'Label 4', 'Last synced');
c12.appendChild(c13);
var c14;
(function() {
  var _cs = _imp_fmTableCell;
  if (_cs.type === 'COMPONENT_SET') {
    var _variants = _cs.children;
    var _target = null;
    for (var _i = 0; _i < _variants.length; _i++) {
      if (_variants[_i].name === 'Type=Data') { _target = _variants[_i]; break; }
    }
    if (!_target) {
      for (var _j = 0; _j < _variants.length; _j++) {
        if (_variants[_j].name.indexOf('Type=Data') !== -1) { _target = _variants[_j]; break; }
      }
    }
    if (_target) {
      c14 = _target.createInstance();
    } else {
      c14 = (_cs.defaultVariant || _cs.children[0]).createInstance();
    }
  } else {
    c14 = _cs.createInstance();
  }
})();
setProp(c14, 'Label', 'Production DB');
setProp(c14, 'Label 2', 'PostgreSQL');
setProp(c14, 'Label 3', 'Active');
setProp(c14, 'Label 4', '2 hours ago');
c12.appendChild(c14);
var c15;
(function() {
  var _cs = _imp_fmTableCell;
  if (_cs.type === 'COMPONENT_SET') {
    var _variants = _cs.children;
    var _target = null;
    for (var _i = 0; _i < _variants.length; _i++) {
      if (_variants[_i].name === 'Type=Data') { _target = _variants[_i]; break; }
    }
    if (!_target) {
      for (var _j = 0; _j < _variants.length; _j++) {
        if (_variants[_j].name.indexOf('Type=Data') !== -1) { _target = _variants[_j]; break; }
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
setProp(c15, 'Label', 'Staging DB');
setProp(c15, 'Label 2', 'PostgreSQL');
setProp(c15, 'Label 3', 'Active');
setProp(c15, 'Label 4', '1 day ago');
c12.appendChild(c15);
var c16;
(function() {
  var _cs = _imp_fmTableCell;
  if (_cs.type === 'COMPONENT_SET') {
    var _variants = _cs.children;
    var _target = null;
    for (var _i = 0; _i < _variants.length; _i++) {
      if (_variants[_i].name === 'Type=Data') { _target = _variants[_i]; break; }
    }
    if (!_target) {
      for (var _j = 0; _j < _variants.length; _j++) {
        if (_variants[_j].name.indexOf('Type=Data') !== -1) { _target = _variants[_j]; break; }
      }
    }
    if (_target) {
      c16 = _target.createInstance();
    } else {
      c16 = (_cs.defaultVariant || _cs.children[0]).createInstance();
    }
  } else {
    c16 = _cs.createInstance();
  }
})();
setProp(c16, 'Label', 'Analytics API');
setProp(c16, 'Label 2', 'REST API');
setProp(c16, 'Label 3', 'Error');
setProp(c16, 'Label 4', '3 days ago');
c12.appendChild(c16);
c10.appendChild(c12);
_fillH(c12);
c12.layoutSizingVertical = 'HUG';
c4.appendChild(c10);
_fillH(c10);
_fillV(c10);
c2.appendChild(c4);
_fillH(c4);
_fillV(c4);
_wrapper.appendChild(c2);
_nodeCount++;
var c17 = figma.createFrame();
c17.name = 'New connection — Step 1';
c17.layoutMode = 'VERTICAL';
c17.itemSpacing = 0;
c17.primaryAxisSizingMode = 'AUTO';
c17.counterAxisSizingMode = 'AUTO';
c17.fills = [{ type: 'SOLID', color: hexToRgb('#FFFFFF') }];
c17.clipsContent = true;
c17.resize(1440, 960);
var c18;
(function() {
  var _cs = _imp_fmAppHeader;
  if (_cs.type === 'COMPONENT_SET') {
    var _variants = _cs.children;
    var _target = null;
    for (var _i = 0; _i < _variants.length; _i++) {
      if (_variants[_i].name === 'Type=Studio') { _target = _variants[_i]; break; }
    }
    if (!_target) {
      for (var _j = 0; _j < _variants.length; _j++) {
        if (_variants[_j].name.indexOf('Type=Studio') !== -1) { _target = _variants[_j]; break; }
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
c18.name = 'App Header';
c17.appendChild(c18);
var c19 = figma.createFrame();
c19.name = 'Body';
c19.layoutMode = 'HORIZONTAL';
c19.itemSpacing = 0;
c19.primaryAxisSizingMode = 'AUTO';
c19.counterAxisSizingMode = 'AUTO';
c19.fills = [];
c19.resize(1440, 890);
var c20 = figma.createFrame();
c20.name = 'Sidebar';
c20.layoutMode = 'VERTICAL';
c20.itemSpacing = 0;
c20.paddingTop = 28;
c20.paddingRight = 16;
c20.paddingBottom = 8;
c20.paddingLeft = 16;
c20.primaryAxisSizingMode = 'AUTO';
c20.counterAxisSizingMode = 'AUTO';
c20.fills = [{ type: 'SOLID', color: hexToRgb('#FFFFFF') }];
c20.resize(260, 890);
var c21;
(function() {
  var _cs = _imp_fmSideNavItem;
  if (_cs.type === 'COMPONENT_SET') {
    var _variants = _cs.children;
    var _target = null;
    for (var _i = 0; _i < _variants.length; _i++) {
      if (_variants[_i].name === 'State=On') { _target = _variants[_i]; break; }
    }
    if (!_target) {
      for (var _j = 0; _j < _variants.length; _j++) {
        if (_variants[_j].name.indexOf('State=On') !== -1) { _target = _variants[_j]; break; }
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
c21.name = 'Nav: Home';
setProp(c21, 'Label', 'Home');
c20.appendChild(c21);
var c22;
(function() {
  var _cs = _imp_fmSideNavItem;
  if (_cs.type === 'COMPONENT_SET') {
    var _variants = _cs.children;
    var _target = null;
    for (var _i = 0; _i < _variants.length; _i++) {
      if (_variants[_i].name === 'State=Placeholder') { _target = _variants[_i]; break; }
    }
    if (!_target) {
      for (var _j = 0; _j < _variants.length; _j++) {
        if (_variants[_j].name.indexOf('State=Placeholder') !== -1) { _target = _variants[_j]; break; }
      }
    }
    if (_target) {
      c22 = _target.createInstance();
    } else {
      c22 = (_cs.defaultVariant || _cs.children[0]).createInstance();
    }
  } else {
    c22 = _cs.createInstance();
  }
})();
c22.name = 'Nav: Placeholder 1';
c20.appendChild(c22);
var c23;
(function() {
  var _cs = _imp_fmSideNavItem;
  if (_cs.type === 'COMPONENT_SET') {
    var _variants = _cs.children;
    var _target = null;
    for (var _i = 0; _i < _variants.length; _i++) {
      if (_variants[_i].name === 'State=Placeholder') { _target = _variants[_i]; break; }
    }
    if (!_target) {
      for (var _j = 0; _j < _variants.length; _j++) {
        if (_variants[_j].name.indexOf('State=Placeholder') !== -1) { _target = _variants[_j]; break; }
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
c23.name = 'Nav: Placeholder 2';
c20.appendChild(c23);
var c24;
(function() {
  var _cs = _imp_fmSideNavItem;
  if (_cs.type === 'COMPONENT_SET') {
    var _variants = _cs.children;
    var _target = null;
    for (var _i = 0; _i < _variants.length; _i++) {
      if (_variants[_i].name === 'State=Placeholder') { _target = _variants[_i]; break; }
    }
    if (!_target) {
      for (var _j = 0; _j < _variants.length; _j++) {
        if (_variants[_j].name.indexOf('State=Placeholder') !== -1) { _target = _variants[_j]; break; }
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
c24.name = 'Nav: Placeholder 3';
c20.appendChild(c24);
c19.appendChild(c20);
var c25 = figma.createFrame();
c25.name = 'Content Area';
c25.layoutMode = 'VERTICAL';
c25.itemSpacing = 16;
c25.paddingTop = 24;
c25.paddingRight = 32;
c25.paddingBottom = 24;
c25.paddingLeft = 32;
c25.primaryAxisSizingMode = 'AUTO';
c25.counterAxisSizingMode = 'AUTO';
c25.fills = [{ type: 'SOLID', color: hexToRgb('#F5F5FA') }];
c25.resize(1180, 890);
var c26;
(function() {
  var _cs = _imp_fmPageHeader;
  if (_cs.type === 'COMPONENT_SET') {
    var _variants = _cs.children;
    var _target = null;
    for (var _i = 0; _i < _variants.length; _i++) {
      if (_variants[_i].name === 'Type=Title + Subtitle') { _target = _variants[_i]; break; }
    }
    if (!_target) {
      for (var _j = 0; _j < _variants.length; _j++) {
        if (_variants[_j].name.indexOf('Type=Title + Subtitle') !== -1) { _target = _variants[_j]; break; }
      }
    }
    if (_target) {
      c26 = _target.createInstance();
    } else {
      c26 = (_cs.defaultVariant || _cs.children[0]).createInstance();
    }
  } else {
    c26 = _cs.createInstance();
  }
})();
c26.name = 'Page Header';
setProp(c26, 'Title', 'New connection');
setProp(c26, 'Subtitle', 'Step 1 of 3 — Choose type');
c25.appendChild(c26);
var c27 = figma.createFrame();
c27.name = 'Connection type grid';
c27.layoutMode = 'HORIZONTAL';
c27.itemSpacing = 16;
c27.layoutWrap = 'WRAP';
c27.paddingTop = 0;
c27.paddingRight = 0;
c27.paddingBottom = 0;
c27.paddingLeft = 0;
c27.primaryAxisSizingMode = 'AUTO';
c27.counterAxisSizingMode = 'AUTO';
c27.fills = [];
var c28 = figma.createFrame();
c28.name = 'PostgreSQL card';
c28.layoutMode = 'VERTICAL';
c28.itemSpacing = 8;
c28.paddingTop = 24;
c28.paddingRight = 24;
c28.paddingBottom = 24;
c28.paddingLeft = 24;
c28.primaryAxisSizingMode = 'AUTO';
c28.counterAxisSizingMode = 'AUTO';
c28.fills = [{ type: 'SOLID', color: hexToRgb('#FFFFFF') }];
c28.cornerRadius = 8;
c28.strokes = [{ type: 'SOLID', color: hexToRgb('#E2E7F0') }];
c28.strokeWeight = 1;
var c29 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });
c29.fontName = { family: 'Inter', style: 'Semi Bold' };
c29.fontSize = 16;
c29.characters = 'PostgreSQL';
c29.fills = [{ type: 'SOLID', color: hexToRgb('#1A1A2E') }];
c28.appendChild(c29);
var c30 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
c30.fontName = { family: 'Inter', style: 'Regular' };
c30.fontSize = 14;
c30.characters = 'Connect to PostgreSQL databases';
c30.fills = [{ type: 'SOLID', color: hexToRgb('#595968') }];
c28.appendChild(c30);
c27.appendChild(c28);
c28.layoutSizingVertical = 'HUG';
var c31 = figma.createFrame();
c31.name = 'MySQL card';
c31.layoutMode = 'VERTICAL';
c31.itemSpacing = 8;
c31.paddingTop = 24;
c31.paddingRight = 24;
c31.paddingBottom = 24;
c31.paddingLeft = 24;
c31.primaryAxisSizingMode = 'AUTO';
c31.counterAxisSizingMode = 'AUTO';
c31.fills = [{ type: 'SOLID', color: hexToRgb('#FFFFFF') }];
c31.cornerRadius = 8;
c31.strokes = [{ type: 'SOLID', color: hexToRgb('#E2E7F0') }];
c31.strokeWeight = 1;
var c32 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });
c32.fontName = { family: 'Inter', style: 'Semi Bold' };
c32.fontSize = 16;
c32.characters = 'MySQL';
c32.fills = [{ type: 'SOLID', color: hexToRgb('#1A1A2E') }];
c31.appendChild(c32);
var c33 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
c33.fontName = { family: 'Inter', style: 'Regular' };
c33.fontSize = 14;
c33.characters = 'Connect to MySQL databases';
c33.fills = [{ type: 'SOLID', color: hexToRgb('#595968') }];
c31.appendChild(c33);
c27.appendChild(c31);
c31.layoutSizingVertical = 'HUG';
var c34 = figma.createFrame();
c34.name = 'REST API card';
c34.layoutMode = 'VERTICAL';
c34.itemSpacing = 8;
c34.paddingTop = 24;
c34.paddingRight = 24;
c34.paddingBottom = 24;
c34.paddingLeft = 24;
c34.primaryAxisSizingMode = 'AUTO';
c34.counterAxisSizingMode = 'AUTO';
c34.fills = [{ type: 'SOLID', color: hexToRgb('#FFFFFF') }];
c34.cornerRadius = 8;
c34.strokes = [{ type: 'SOLID', color: hexToRgb('#E2E7F0') }];
c34.strokeWeight = 1;
var c35 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });
c35.fontName = { family: 'Inter', style: 'Semi Bold' };
c35.fontSize = 16;
c35.characters = 'REST API';
c35.fills = [{ type: 'SOLID', color: hexToRgb('#1A1A2E') }];
c34.appendChild(c35);
var c36 = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
c36.fontName = { family: 'Inter', style: 'Regular' };
c36.fontSize = 14;
c36.characters = 'Connect to REST API endpoints';
c36.fills = [{ type: 'SOLID', color: hexToRgb('#595968') }];
c34.appendChild(c36);
c27.appendChild(c34);
c34.layoutSizingVertical = 'HUG';
c25.appendChild(c27);
_fillH(c27);
c27.layoutSizingVertical = 'HUG';
c19.appendChild(c25);
_fillH(c25);
_fillV(c25);
c17.appendChild(c19);
_fillH(c19);
_fillV(c19);
_wrapper.appendChild(c17);
_nodeCount++;

// Create container frame and position below existing content
var _section = figma.createFrame();
_section.name = 'generate-flow: Connection settings';
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
_wrapper.setSharedPluginData('actian_ds', 'skill', 'generate-flow');
_wrapper.setSharedPluginData('actian_ds', 'pushed_at', new Date().toISOString());

// Return metadata
return { wrapperId: _wrapper.id, nodeCount: _nodeCount, sectionId: _section.id };