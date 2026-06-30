await Promise.all([figma.loadFontAsync({ family: "Inter", style: "Bold" })]);
var __dsDropped = [];
var __dsSetProps = function dsSetPropsBestEffort(inst, want, dropped) {
  var defs = inst.componentProperties || {};
  var resolved = {};
  Object.keys(want).forEach(function (name) {
    var k = Object.keys(defs).find(function (d) {
      return d === name || d.split("#")[0] === name;
    });
    if (k) resolved[k] = want[name];
    else if (dropped) dropped.push(name);
  });
  var keys = Object.keys(resolved);
  if (!keys.length) return;
  try {
    inst.setProperties(resolved);
  } catch (e) {
    // An invalid value for one prop must not drop the rest (vendor drift).
    // Retry per-prop so we set everything that is valid.
    keys.forEach(function (k) {
      var one = {};
      one[k] = resolved[k];
      try {
        inst.setProperties(one);
      } catch (e2) {
        if (dropped) dropped.push(k);
      }
    });
  }
};
const root0 = figma.createFrame();
root0.name = "Create form";
root0.layoutMode = 'VERTICAL';
root0.primaryAxisSizingMode = 'AUTO';
root0.counterAxisSizingMode = 'AUTO';
root0.itemSpacing = 16;
root0.paddingTop = 24;
root0.paddingRight = 24;
root0.paddingBottom = 24;
root0.paddingLeft = 24;
root0.fills = [{ type: 'SOLID', color: { r:1, g:1, b:1 } }];
root0.topLeftRadius = 8;
root0.topRightRadius = 8;
root0.bottomRightRadius = 8;
root0.bottomLeftRadius = 8;
const root0_c0 = figma.createText();
root0_c0.fontName = { family: "Inter", style: "Bold" };
root0_c0.characters = "Create Record";
root0_c0.fontSize = 20;
root0_c0.lineHeight = { value: 28, unit: "PIXELS" };
root0_c0.letterSpacing = { value: 0.5, unit: "PIXELS" };
root0_c0.fills = [{ type:'SOLID', color: { r:0.10196078431372549, g:0.10196078431372549, b:0.1803921568627451 } }];
root0.appendChild(root0_c0);
const root0_c1_set = await figma.importComponentSetByKeyAsync("355855c7b2e05b5b336167883b3c9ebbfbd881ad");
const root0_c1 = root0_c1_set.defaultVariant.createInstance();
__dsSetProps(root0_c1, {"Input Text":"Enter name","Label Text":"Name"}, __dsDropped);
root0.appendChild(root0_c1);
const root0_c2_set = await figma.importComponentSetByKeyAsync("355855c7b2e05b5b336167883b3c9ebbfbd881ad");
const root0_c2 = root0_c2_set.defaultVariant.createInstance();
__dsSetProps(root0_c2, {"Input Text":"you@example.com","Label Text":"Email"}, __dsDropped);
root0.appendChild(root0_c2);
const root0_c3_set = await figma.importComponentSetByKeyAsync("965cf2c85659bbde891f6f086bbd02d50d445d58");
const root0_c3 = root0_c3_set.defaultVariant.createInstance();
__dsSetProps(root0_c3, {"Label":"I agree to the terms","State":"On"}, __dsDropped);
root0.appendChild(root0_c3);
const root0_c4_set = await figma.importComponentSetByKeyAsync("368b62312ca941c80ea8eeed84a57d33bb470b09");
const root0_c4 = root0_c4_set.defaultVariant.createInstance();
__dsSetProps(root0_c4, {"Label":"Submit","Size":"md","Type":"Primary"}, __dsDropped);
root0.appendChild(root0_c4);
const __parent = await figma.getNodeByIdAsync("1:1");
__parent.appendChild(root0);
root0.layoutSizingHorizontal = 'FILL';
return { createdNodeIds: [root0.id], mutatedNodeIds: ["1:1"], droppedProps: __dsDropped };