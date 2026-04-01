#!/usr/bin/env node
"use strict";

/**
 * codegen.test.js — Tests for figma-codegen.js
 *
 * Run with: node tests/codegen.test.js
 * (from the plugins/actian-design-system directory)
 */

const path = require("path");
const cg = require(path.join(__dirname, "../scripts/figma-codegen.js"));

// ---------------------------------------------------------------------------
// Minimal test harness
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, message) {
  if (condition) {
    passed++;
    process.stdout.write("  ✓ " + message + "\n");
  } else {
    failed++;
    failures.push(message);
    process.stdout.write("  ✗ FAIL: " + message + "\n");
  }
}

function assertContains(str, substr, message) {
  assert(
    typeof str === "string" && str.indexOf(substr) !== -1,
    message + " (expected to contain: " + JSON.stringify(substr) + ")",
  );
}

function assertNotContains(str, substr, message) {
  assert(
    typeof str === "string" && str.indexOf(substr) === -1,
    message + " (expected NOT to contain: " + JSON.stringify(substr) + ")",
  );
}

function section(name) {
  process.stdout.write("\n" + name + "\n");
}

// ---------------------------------------------------------------------------
// Tests: Helper generators
// ---------------------------------------------------------------------------

section("Helper generators");

(function testHexToRgb() {
  const code = cg.generateHexToRgb();
  assertContains(
    code,
    "function hexToRgb(hex)",
    "generateHexToRgb: produces hexToRgb function",
  );
  assertContains(code, "parseInt", "generateHexToRgb: uses parseInt");
  assertContains(
    code,
    "/ 255",
    "generateHexToRgb: divides by 255 for 0-1 range",
  );
  assertContains(
    code,
    "substring(0, 2)",
    "generateHexToRgb: extracts red channel",
  );
  assertContains(
    code,
    "substring(2, 4)",
    "generateHexToRgb: extracts green channel",
  );
  assertContains(
    code,
    "substring(4, 6)",
    "generateHexToRgb: extracts blue channel",
  );
})();

(function testAngleToTransform() {
  const code = cg.generateAngleToTransform();
  assertContains(
    code,
    "function angleToTransform(angleDeg)",
    "generateAngleToTransform: produces angleToTransform function",
  );
  assertContains(
    code,
    "Math.PI",
    "generateAngleToTransform: converts degrees to radians",
  );
  assertContains(code, "Math.cos", "generateAngleToTransform: uses cos");
  assertContains(code, "Math.sin", "generateAngleToTransform: uses sin");
  assertContains(
    code,
    "0.5",
    "generateAngleToTransform: centers gradient at 0.5",
  );
  // Should return a 2x3 matrix (two arrays of 3 elements each)
  assertContains(
    code,
    "[-sin, cos,",
    "generateAngleToTransform: second row has -sin",
  );
})();

(function testSetProp() {
  const code = cg.generateSetProp();
  assertContains(
    code,
    "function setProp(instance, prefix, value)",
    "generateSetProp: produces setProp function",
  );
  assertContains(
    code,
    "split('#')",
    "generateSetProp: splits on # to get property name prefix",
  );
  assertContains(
    code,
    "setProperties",
    "generateSetProp: calls setProperties on instance",
  );
  assertContains(
    code,
    "componentProperties",
    "generateSetProp: reads componentProperties",
  );
})();

// ---------------------------------------------------------------------------
// Tests: Property code generators
// ---------------------------------------------------------------------------

section("genFills");

(function testGenFillsEmpty() {
  const code = cg.genFills("myNode", []);
  assertContains(
    code,
    "myNode.fills = [];",
    "genFills: empty array sets fills to []",
  );
})();

(function testGenFillsHex() {
  const code = cg.genFills("n0", ["#FF0000"]);
  assertContains(code, "type: 'SOLID'", "genFills: hex produces SOLID fill");
  assertContains(
    code,
    "hexToRgb('#FF0000')",
    "genFills: calls hexToRgb with hex value",
  );
})();

(function testGenFillsMultipleHex() {
  const code = cg.genFills("n0", ["#FF0000", "#00FF00"]);
  assertContains(code, "#FF0000", "genFills: includes first color");
  assertContains(code, "#00FF00", "genFills: includes second color");
})();

(function testGenFillsGradientLinear() {
  const code = cg.genFills("n0", [
    {
      type: "LINEAR",
      stops: [
        { color: "#FFFFFF", position: 0, opacity: 1 },
        { color: "#000000", position: 1, opacity: 0.5 },
      ],
      angle: 90,
    },
  ]);
  assertContains(
    code,
    "GRADIENT_LINEAR",
    "genFills: LINEAR maps to GRADIENT_LINEAR",
  );
  assertContains(code, "gradientStops", "genFills: gradient has gradientStops");
  assertContains(
    code,
    "gradientTransform",
    "genFills: gradient has gradientTransform",
  );
  assertContains(
    code,
    "angleToTransform(90)",
    "genFills: calls angleToTransform with angle",
  );
})();

(function testGenFillsGradientNoAngle() {
  const code = cg.genFills("n0", [{ type: "RADIAL", stops: [], angle: null }]);
  assertContains(
    code,
    "GRADIENT_RADIAL",
    "genFills: RADIAL maps to GRADIENT_RADIAL",
  );
  assertContains(
    code,
    "[[1, 0, 0], [0, 1, 0]]",
    "genFills: null angle uses identity transform",
  );
})();

(function testGenFillsNull() {
  const code = cg.genFills("n0", null);
  assert(code === "", "genFills: null fills returns empty string");
})();

section("genLayout");

(function testGenLayoutBasic() {
  const code = cg.genLayout("frame", {
    mode: "VERTICAL",
    spacing: 16,
    padding: [8, 12, 8, 12],
    primaryAxisAlign: "CENTER",
    counterAxisAlign: "MIN",
  });
  assertContains(
    code,
    "frame.layoutMode = 'VERTICAL';",
    "genLayout: sets layoutMode",
  );
  assertContains(
    code,
    "frame.itemSpacing = 16;",
    "genLayout: sets itemSpacing",
  );
  assertContains(code, "frame.paddingTop = 8;", "genLayout: sets paddingTop");
  assertContains(
    code,
    "frame.paddingRight = 12;",
    "genLayout: sets paddingRight",
  );
  assertContains(
    code,
    "frame.paddingBottom = 8;",
    "genLayout: sets paddingBottom",
  );
  assertContains(
    code,
    "frame.paddingLeft = 12;",
    "genLayout: sets paddingLeft",
  );
  assertContains(
    code,
    "frame.primaryAxisAlignItems = 'CENTER';",
    "genLayout: sets primaryAxisAlignItems",
  );
  assertContains(
    code,
    "frame.counterAxisAlignItems = 'MIN';",
    "genLayout: sets counterAxisAlignItems",
  );
  assertContains(
    code,
    "frame.primaryAxisSizingMode = 'AUTO';",
    "genLayout: always sets primaryAxisSizingMode AUTO",
  );
  assertContains(
    code,
    "frame.counterAxisSizingMode = 'AUTO';",
    "genLayout: always sets counterAxisSizingMode AUTO",
  );
})();

(function testGenLayoutWrap() {
  const code = cg.genLayout("f", { mode: "HORIZONTAL", wrap: true });
  assertContains(
    code,
    "f.layoutWrap = 'WRAP';",
    "genLayout: sets layoutWrap to WRAP",
  );
})();

(function testGenLayoutNone() {
  const code = cg.genLayout("f", null);
  assert(code === "", "genLayout: null layout returns empty string");
})();

(function testGenLayoutCounterAxisSpacing() {
  const code = cg.genLayout("f", { counterAxisSpacing: 8 });
  assertContains(
    code,
    "f.counterAxisSpacing = 8;",
    "genLayout: sets counterAxisSpacing",
  );
})();

section("genStroke");

(function testGenStrokeBasic() {
  const code = cg.genStroke("n", {
    color: "#333333",
    weight: 1,
    align: "INSIDE",
  });
  assertContains(
    code,
    "hexToRgb('#333333')",
    "genStroke: calls hexToRgb for stroke color",
  );
  assertContains(code, "type: 'SOLID'", "genStroke: stroke is SOLID type");
  assertContains(code, "n.strokeWeight = 1;", "genStroke: sets strokeWeight");
  assertContains(
    code,
    "n.strokeAlign = 'INSIDE';",
    "genStroke: sets strokeAlign",
  );
})();

(function testGenStrokeSides() {
  const code = cg.genStroke("n", {
    color: "#000",
    sides: { top: true, right: false, bottom: false, left: true },
  });
  assertContains(
    code,
    "n.strokeRightWeight = 0;",
    "genStroke: sets right weight to 0 when false",
  );
  assertContains(
    code,
    "n.strokeBottomWeight = 0;",
    "genStroke: sets bottom weight to 0 when false",
  );
  assertNotContains(
    code,
    "n.strokeTopWeight",
    "genStroke: does not set top weight when true",
  );
  assertNotContains(
    code,
    "n.strokeLeftWeight",
    "genStroke: does not set left weight when true",
  );
})();

(function testGenStrokeNull() {
  const code = cg.genStroke("n", null);
  assert(code === "", "genStroke: null stroke returns empty string");
})();

section("genEffects");

(function testGenEffectsDropShadow() {
  const code = cg.genEffects("n", [
    {
      type: "DROP_SHADOW",
      color: "#000000",
      opacity: 0.3,
      offset: { x: 0, y: 4 },
      radius: 8,
      spread: 0,
    },
  ]);
  assertContains(code, "type: 'DROP_SHADOW'", "genEffects: DROP_SHADOW type");
  assertContains(
    code,
    "blendMode: 'NORMAL'",
    "genEffects: DROP_SHADOW includes blendMode NORMAL",
  );
  assertContains(code, "visible: true", "genEffects: effect is visible");
  assertContains(code, "a: 0.3", "genEffects: opacity applied to alpha");
  assertContains(code, "x: 0, y: 4", "genEffects: offset applied");
  assertContains(code, "radius: 8", "genEffects: radius applied");
  assertContains(code, "spread: 0", "genEffects: spread applied");
})();

(function testGenEffectsInnerShadow() {
  const code = cg.genEffects("n", [
    {
      type: "INNER_SHADOW",
      color: "#FF0000",
      opacity: 0.5,
      radius: 4,
    },
  ]);
  assertContains(code, "type: 'INNER_SHADOW'", "genEffects: INNER_SHADOW type");
  assertContains(
    code,
    "blendMode: 'NORMAL'",
    "genEffects: INNER_SHADOW includes blendMode NORMAL",
  );
})();

(function testGenEffectsLayerBlur() {
  const code = cg.genEffects("n", [{ type: "LAYER_BLUR", radius: 10 }]);
  assertContains(code, "type: 'LAYER_BLUR'", "genEffects: LAYER_BLUR type");
  assertContains(code, "radius: 10", "genEffects: LAYER_BLUR radius");
  assertNotContains(
    code,
    "blendMode",
    "genEffects: LAYER_BLUR has no blendMode",
  );
})();

(function testGenEffectsBackgroundBlur() {
  const code = cg.genEffects("n", [{ type: "BACKGROUND_BLUR", radius: 20 }]);
  assertContains(
    code,
    "type: 'BACKGROUND_BLUR'",
    "genEffects: BACKGROUND_BLUR type",
  );
})();

(function testGenEffectsEmpty() {
  const code = cg.genEffects("n", []);
  assert(code === "", "genEffects: empty array returns empty string");
})();

section("genCornerRadius");

(function testGenCornerRadiusUniform() {
  const code = cg.genCornerRadius("n", 8);
  assertContains(
    code,
    "n.cornerRadius = 8;",
    "genCornerRadius: uniform radius",
  );
})();

(function testGenCornerRadiusPerSide() {
  const code = cg.genCornerRadius("n", {
    topLeft: 4,
    topRight: 8,
    bottomRight: 0,
    bottomLeft: 2,
  });
  assertContains(code, "n.topLeftRadius = 4;", "genCornerRadius: topLeft");
  assertContains(code, "n.topRightRadius = 8;", "genCornerRadius: topRight");
  assertContains(
    code,
    "n.bottomRightRadius = 0;",
    "genCornerRadius: bottomRight",
  );
  assertContains(
    code,
    "n.bottomLeftRadius = 2;",
    "genCornerRadius: bottomLeft",
  );
})();

(function testGenCornerRadiusNull() {
  const code = cg.genCornerRadius("n", null);
  assert(code === "", "genCornerRadius: null returns empty string");
})();

section("genSizing");

(function testGenSizingFill() {
  const code = cg.genSizing("n", { horizontal: "FILL", vertical: "FILL" });
  assertContains(
    code,
    "layoutSizingHorizontal = 'FILL'",
    "genSizing: FILL horizontal in auto-layout",
  );
  assertContains(
    code,
    "layoutSizingVertical = 'FILL'",
    "genSizing: FILL vertical in auto-layout",
  );
  // Should have fallback for non-auto-layout parent
  assertContains(
    code,
    "n.parent.width",
    "genSizing: FILL horizontal has parent width fallback",
  );
})();

(function testGenSizingHug() {
  const code = cg.genSizing("n", { horizontal: "HUG", vertical: "HUG" });
  assertContains(
    code,
    "n.layoutSizingHorizontal = 'HUG';",
    "genSizing: HUG horizontal",
  );
  assertContains(
    code,
    "n.layoutSizingVertical = 'HUG';",
    "genSizing: HUG vertical",
  );
})();

(function testGenSizingFixed() {
  const code = cg.genSizing("n", { horizontal: 200, vertical: 100 });
  assertContains(
    code,
    "n.layoutSizingHorizontal = 'FIXED';",
    "genSizing: fixed horizontal FIXED mode",
  );
  assertContains(
    code,
    "n.resize(200, n.height);",
    "genSizing: fixed horizontal resize width",
  );
  assertContains(
    code,
    "n.layoutSizingVertical = 'FIXED';",
    "genSizing: fixed vertical FIXED mode",
  );
  assertContains(
    code,
    "n.resize(n.width, 100);",
    "genSizing: fixed vertical resize height",
  );
})();

(function testGenSizingConstraints() {
  const code = cg.genSizing("n", {
    minWidth: 100,
    maxWidth: 400,
    minHeight: 50,
    maxHeight: 200,
  });
  assertContains(code, "n.minWidth = 100;", "genSizing: minWidth");
  assertContains(code, "n.maxWidth = 400;", "genSizing: maxWidth");
  assertContains(code, "n.minHeight = 50;", "genSizing: minHeight");
  assertContains(code, "n.maxHeight = 200;", "genSizing: maxHeight");
})();

(function testGenSizingNull() {
  const code = cg.genSizing("n", null);
  assert(code === "", "genSizing: null returns empty string");
})();

// ---------------------------------------------------------------------------
// Tests: Node code generators
// ---------------------------------------------------------------------------

section("generateNodeCode: FRAME");

(function testFrameBasic() {
  cg.resetCounter();
  const code = cg.generateNodeCode(
    {
      type: "FRAME",
      name: "My Frame",
      fills: ["#FFFFFF"],
      width: 400,
      height: 300,
    },
    "f0",
  );
  assertContains(code, "var f0 = figma.createFrame();", "FRAME: creates frame");
  assertContains(code, "f0.name = 'My Frame';", "FRAME: sets name");
  assertContains(code, "f0.fills =", "FRAME: applies fills");
  assertContains(code, "f0.resize(400, 300);", "FRAME: resizes");
})();

(function testFrameLayoutBeforeChildren() {
  cg.resetCounter();
  const code = cg.generateNodeCode(
    {
      type: "FRAME",
      name: "Layout Frame",
      layout: { mode: "VERTICAL", spacing: 8 },
      children: [{ type: "RECT", name: "Box", width: 100, height: 50 }],
    },
    "f0",
  );
  // Layout code must appear before child code
  const layoutIdx = code.indexOf("f0.layoutMode = 'VERTICAL'");
  const childIdx = code.indexOf("figma.createRectangle");
  assert(
    layoutIdx < childIdx,
    "FRAME: layout is set before children are appended",
  );
})();

(function testFrameChildren() {
  cg.resetCounter();
  const code = cg.generateNodeCode(
    {
      type: "FRAME",
      name: "Parent",
      children: [
        { type: "RECT", name: "Child1", width: 50, height: 50 },
        { type: "RECT", name: "Child2", width: 50, height: 50 },
      ],
    },
    "f0",
  );
  assertContains(code, "f0.appendChild(", "FRAME: appends children to frame");
  // Children get unique variable names
  assertContains(code, "var c0 =", "FRAME: first child gets unique var");
  assertContains(code, "var c1 =", "FRAME: second child gets unique var");
})();

(function testFrameChildrenWithSizing() {
  cg.resetCounter();
  const code = cg.generateNodeCode(
    {
      type: "FRAME",
      name: "Parent",
      layout: { mode: "HORIZONTAL" },
      children: [
        {
          type: "RECT",
          name: "Child",
          width: 50,
          height: 50,
          sizing: { horizontal: "FILL" },
        },
      ],
    },
    "f0",
  );
  assertContains(
    code,
    "layoutSizingHorizontal",
    "FRAME: applies sizing to children after appendChild",
  );
  // Sizing must appear AFTER appendChild
  const appendIdx = code.indexOf("f0.appendChild(c0)");
  const sizingIdx = code.indexOf("layoutSizingHorizontal");
  assert(appendIdx < sizingIdx, "FRAME: sizing applied after appendChild");
})();

(function testFrameClipsContent() {
  cg.resetCounter();
  const code = cg.generateNodeCode({ type: "FRAME", clipsContent: true }, "f0");
  assertContains(code, "f0.clipsContent = true;", "FRAME: sets clipsContent");
})();

(function testFrameOpacity() {
  cg.resetCounter();
  const code = cg.generateNodeCode({ type: "FRAME", opacity: 0.5 }, "f0");
  assertContains(code, "f0.opacity = 0.5;", "FRAME: sets opacity");
})();

section("generateNodeCode: TEXT");

(function testTextBasic() {
  cg.resetCounter();
  const code = cg.generateNodeCode(
    {
      type: "TEXT",
      name: "Label",
      font: "Inter:Regular",
      size: 14,
      content: "Hello World",
      color: "#333333",
    },
    "t0",
  );
  assertContains(
    code,
    "var t0 = figma.createText();",
    "TEXT: creates text node",
  );
  assertContains(code, "t0.name = 'Label';", "TEXT: sets name");
  assertContains(code, "await figma.loadFontAsync", "TEXT: loads font async");
  assertContains(code, "family: 'Inter'", "TEXT: font family");
  assertContains(code, "style: 'Regular'", "TEXT: font style");
  assertContains(code, "t0.fontSize = 14;", "TEXT: sets fontSize");
  assertContains(
    code,
    "t0.characters = 'Hello World';",
    "TEXT: sets characters",
  );
  assertContains(code, "hexToRgb('#333333')", "TEXT: applies color fill");
})();

(function testTextFontWithSpace() {
  cg.resetCounter();
  const code = cg.generateNodeCode(
    {
      type: "TEXT",
      font: "Inter:Semi Bold",
      content: "Test",
    },
    "t0",
  );
  assertContains(
    code,
    "style: 'Semi Bold'",
    "TEXT: font style with space preserved",
  );
})();

(function testTextBoldShorthand() {
  cg.resetCounter();
  const code = cg.generateNodeCode(
    {
      type: "TEXT",
      bold: true,
      content: "Bold",
    },
    "t0",
  );
  assertContains(code, "style: 'Bold'", "TEXT: bold shorthand overrides style");
})();

(function testTextWidth() {
  cg.resetCounter();
  const code = cg.generateNodeCode(
    {
      type: "TEXT",
      content: "Wrap me",
      width: 200,
    },
    "t0",
  );
  assertContains(
    code,
    "t0.resize(200, t0.height);",
    "TEXT: fixed width resize",
  );
  assertContains(
    code,
    "t0.textAutoResize = 'HEIGHT';",
    "TEXT: sets textAutoResize to HEIGHT",
  );
})();

(function testTextApostrophe() {
  cg.resetCounter();
  const code = cg.generateNodeCode(
    {
      type: "TEXT",
      name: "User's Name",
      content: "It's working",
    },
    "t0",
  );
  assertContains(code, "User\\'s Name", "TEXT: escapes apostrophe in name");
  assertContains(code, "It\\'s working", "TEXT: escapes apostrophe in content");
})();

(function testTextLetterSpacing() {
  cg.resetCounter();
  const code = cg.generateNodeCode(
    {
      type: "TEXT",
      content: "Spaced",
      letterSpacing: 0.5,
    },
    "t0",
  );
  assertContains(
    code,
    "letterSpacing = { value: 0.5, unit: 'PIXELS' }",
    "TEXT: numeric letterSpacing uses PIXELS unit",
  );
})();

section("generateNodeCode: RECT");

(function testRectBasic() {
  cg.resetCounter();
  const code = cg.generateNodeCode(
    {
      type: "RECT",
      name: "Box",
      width: 100,
      height: 50,
      fills: ["#FF0000"],
      cornerRadius: 4,
      opacity: 0.8,
    },
    "r0",
  );
  assertContains(
    code,
    "var r0 = figma.createRectangle();",
    "RECT: creates rectangle",
  );
  assertContains(code, "r0.name = 'Box';", "RECT: sets name");
  assertContains(code, "r0.resize(100, 50);", "RECT: resizes");
  assertContains(code, "hexToRgb('#FF0000')", "RECT: applies fills");
  assertContains(code, "r0.cornerRadius = 4;", "RECT: sets cornerRadius");
  assertContains(code, "r0.opacity = 0.8;", "RECT: sets opacity");
})();

section("generateNodeCode: ELLIPSE");

(function testEllipseBasic() {
  cg.resetCounter();
  const code = cg.generateNodeCode(
    {
      type: "ELLIPSE",
      name: "Circle",
      width: 40,
      height: 40,
      fills: ["#0000FF"],
    },
    "e0",
  );
  assertContains(
    code,
    "var e0 = figma.createEllipse();",
    "ELLIPSE: creates ellipse",
  );
  assertContains(code, "e0.name = 'Circle';", "ELLIPSE: sets name");
  assertContains(code, "e0.resize(40, 40);", "ELLIPSE: resizes");
  assertContains(code, "hexToRgb('#0000FF')", "ELLIPSE: applies fills");
})();

section("generateNodeCode: DIVIDER");

(function testDividerBasic() {
  cg.resetCounter();
  const code = cg.generateNodeCode({ type: "DIVIDER" }, "d0");
  assertContains(
    code,
    "var d0 = figma.createRectangle();",
    "DIVIDER: creates rectangle",
  );
  assertContains(code, "d0.name = 'Divider';", "DIVIDER: sets name to Divider");
  assertContains(
    code,
    "d0.resize(300, 1);",
    "DIVIDER: default width 300, height 1",
  );
  assertContains(code, "#E0E0E0", "DIVIDER: default color #E0E0E0");
})();

(function testDividerCustom() {
  cg.resetCounter();
  const code = cg.generateNodeCode(
    { type: "DIVIDER", width: 500, color: "#CCCCCC" },
    "d0",
  );
  assertContains(code, "d0.resize(500, 1);", "DIVIDER: custom width");
  assertContains(code, "#CCCCCC", "DIVIDER: custom color");
})();

section("generateNodeCode: INSTANCE");

(function testInstanceBasicNoVariant() {
  cg.resetCounter();
  const code = cg.generateNodeCode(
    {
      type: "INSTANCE",
      ref: "myBtn",
      name: "Button",
    },
    "inst0",
  );
  assertContains(code, "var inst0;", "INSTANCE: declares variable");
  assertContains(
    code,
    "_imp_myBtn",
    "INSTANCE: references import var by ref name",
  );
  assertContains(code, "createInstance()", "INSTANCE: calls createInstance");
  assertContains(code, "inst0.name = 'Button';", "INSTANCE: sets name");
})();

(function testInstanceWithVariant() {
  cg.resetCounter();
  const code = cg.generateNodeCode(
    {
      type: "INSTANCE",
      ref: "btn",
      variant: "Size=Large, State=Default",
    },
    "inst0",
  );
  assertContains(code, "COMPONENT_SET", "INSTANCE: checks for COMPONENT_SET");
  assertContains(
    code,
    "Size=Large, State=Default",
    "INSTANCE: includes variant name for matching",
  );
  assertContains(code, "indexOf", "INSTANCE: uses partial match fallback");
  assertContains(
    code,
    "defaultVariant",
    "INSTANCE: falls back to defaultVariant",
  );
})();

(function testInstanceWithProps() {
  cg.resetCounter();
  const code = cg.generateNodeCode(
    {
      type: "INSTANCE",
      ref: "btn",
      props: { Label: "Click Me", Icon: false },
    },
    "inst0",
  );
  assertContains(
    code,
    "setProp(inst0, 'Label', 'Click Me');",
    "INSTANCE: sets Label prop",
  );
  assertContains(
    code,
    "setProp(inst0, 'Icon', false);",
    "INSTANCE: sets boolean prop",
  );
})();

// ---------------------------------------------------------------------------
// Tests: Variable name uniqueness
// ---------------------------------------------------------------------------

section("Variable name uniqueness");

(function testCounterResets() {
  cg.resetCounter();
  const v1 = cg.nextVar("c");
  const v2 = cg.nextVar("c");
  assert(v1 === "c0", "nextVar: first var is c0 after reset");
  assert(v2 === "c1", "nextVar: second var is c1");

  cg.resetCounter();
  const v3 = cg.nextVar("c");
  assert(v3 === "c0", "nextVar: resets to c0 after resetCounter");
})();

(function testNoCollisionAcrossChildren() {
  cg.resetCounter();
  const code = cg.generateNodeCode(
    {
      type: "FRAME",
      children: [
        {
          type: "FRAME",
          children: [{ type: "RECT", name: "Inner", width: 10, height: 10 }],
        },
        { type: "RECT", name: "Sibling", width: 10, height: 10 },
      ],
    },
    "root",
  );

  // All unique var names (c0, c1, c2, etc.) should appear only once as declarations
  const declarations = code.match(/var c\d+ =/g) || [];
  const unique = new Set(declarations);
  assert(
    declarations.length === unique.size,
    "No variable name collisions across recursive children",
  );
})();

// ---------------------------------------------------------------------------
// Tests: generateCallCode
// ---------------------------------------------------------------------------

section("generateCallCode: complete output");

const MINIMAL_SPEC = {
  meta: {
    targetNodeId: "123:456",
    skill: "test-skill",
    component: "TestComp",
    wrapperName: "Test Output",
  },
  fonts: ["Inter:Regular", "Inter:Semi Bold"],
  imports: {
    myBtn: { key: "abc123", method: "set" },
    myIcon: { key: "def456", method: "single" },
  },
  tree: [
    {
      type: "FRAME",
      name: "Card",
      layout: { mode: "VERTICAL", spacing: 16 },
      children: [
        {
          type: "TEXT",
          name: "Title",
          font: "Inter:Regular",
          content: "Hello",
          size: 16,
        },
      ],
    },
  ],
};

(function testCallCodeStructure() {
  const code = cg.generateCallCode(MINIMAL_SPEC);
  assertContains(
    code,
    "function hexToRgb",
    "generateCallCode: includes hexToRgb helper",
  );
  assertContains(
    code,
    "function angleToTransform",
    "generateCallCode: includes angleToTransform helper",
  );
  assertContains(
    code,
    "function setProp",
    "generateCallCode: includes setProp helper",
  );
  assertContains(
    code,
    "(async function() {",
    "generateCallCode: async IIFE wrapper",
  );
  assertContains(code, "})();", "generateCallCode: IIFE is invoked");
})();

(function testCallCodeNavigation() {
  const code = cg.generateCallCode(MINIMAL_SPEC);
  assertContains(
    code,
    "figma.getNodeByIdAsync('123:456')",
    "generateCallCode: navigates to target node",
  );
  assertContains(
    code,
    "figma.setCurrentPageAsync",
    "generateCallCode: sets current page",
  );
})();

(function testCallCodeFontLoading() {
  const code = cg.generateCallCode(MINIMAL_SPEC);
  assertContains(
    code,
    "Promise.all([",
    "generateCallCode: loads fonts in parallel",
  );
  assertContains(
    code,
    "family: 'Inter', style: 'Regular'",
    "generateCallCode: loads Inter Regular",
  );
  assertContains(
    code,
    "family: 'Inter', style: 'Semi Bold'",
    "generateCallCode: loads Inter Semi Bold (with space)",
  );
})();

(function testCallCodeImports() {
  const code = cg.generateCallCode(MINIMAL_SPEC);
  assertContains(
    code,
    "importComponentSetByKeyAsync",
    "generateCallCode: imports component sets",
  );
  assertContains(
    code,
    "'abc123'",
    "generateCallCode: uses correct key for set import",
  );
  assertContains(
    code,
    "importComponentByKeyAsync",
    "generateCallCode: imports single components",
  );
  assertContains(
    code,
    "'def456'",
    "generateCallCode: uses correct key for single import",
  );
  assertContains(
    code,
    "var _imp_myBtn",
    "generateCallCode: names import variable correctly",
  );
})();

(function testCallCodeWrapper() {
  const code = cg.generateCallCode(MINIMAL_SPEC);
  assertContains(
    code,
    "var _wrapper = figma.createFrame();",
    "generateCallCode: creates wrapper frame",
  );
  assertContains(
    code,
    "_wrapper.name = 'Test Output';",
    "generateCallCode: sets wrapper name",
  );
  assertContains(
    code,
    "_wrapper.layoutMode = 'HORIZONTAL';",
    "generateCallCode: wrapper is horizontal",
  );
  assertContains(
    code,
    "_wrapper.fills = [];",
    "generateCallCode: wrapper has no fills",
  );
})();

(function testCallCodeTree() {
  const code = cg.generateCallCode(MINIMAL_SPEC);
  assertContains(
    code,
    "_wrapper.appendChild(",
    "generateCallCode: appends tree nodes to wrapper",
  );
  assertContains(code, "_nodeCount++;", "generateCallCode: counts nodes");
})();

(function testCallCodeSection() {
  const code = cg.generateCallCode(MINIMAL_SPEC);
  assertContains(
    code,
    "var _section = figma.createSection();",
    "generateCallCode: creates section",
  );
  assertContains(
    code,
    "_section.name = 'Test Output';",
    "generateCallCode: section has correct name",
  );
  assertContains(
    code,
    "_section.appendChild(_wrapper);",
    "generateCallCode: wrapper appended to section",
  );
  assertContains(
    code,
    "_section.x = 0;",
    "generateCallCode: positions section at x=0",
  );
  assertContains(
    code,
    "_maxBottom + 200",
    "generateCallCode: positions section 200px below existing content",
  );
})();

(function testCallCodePluginData() {
  const code = cg.generateCallCode(MINIMAL_SPEC);
  assertContains(
    code,
    "setSharedPluginData('actian_ds', 'skill', 'test-skill')",
    "generateCallCode: tags skill",
  );
  assertContains(
    code,
    "setSharedPluginData('actian_ds', 'pushed_at'",
    "generateCallCode: tags pushed_at",
  );
})();

(function testCallCodeReturn() {
  const code = cg.generateCallCode(MINIMAL_SPEC);
  assertContains(
    code,
    "wrapperId: _wrapper.id",
    "generateCallCode: returns wrapperId",
  );
  assertContains(
    code,
    "nodeCount: _nodeCount",
    "generateCallCode: returns nodeCount",
  );
  assertContains(
    code,
    "sectionId: _section.id",
    "generateCallCode: returns sectionId when new wrapper",
  );
})();

section("generateCallCode: appendToId mode");

(function testAppendToIdSkipsWrapper() {
  // Use a spec with no FRAME tree nodes to avoid false positives from tree nodes
  const spec = {
    meta: {
      targetNodeId: "123:456",
      skill: "test-skill",
      appendToId: "789:012",
    },
    fonts: [],
    imports: {},
    tree: [{ type: "RECT", name: "Box", width: 100, height: 50 }],
  };
  const code = cg.generateCallCode(spec);
  assertContains(
    code,
    "figma.getNodeByIdAsync('789:012')",
    "appendToId: fetches existing wrapper by id",
  );
  // Confirm wrapper is fetched (not created): should use getNodeByIdAsync for wrapper, not createFrame
  assertContains(
    code,
    "var _wrapper = await figma.getNodeByIdAsync",
    "appendToId: wrapper is fetched via getNodeByIdAsync",
  );
  assertNotContains(
    code,
    "var _wrapper = figma.createFrame()",
    "appendToId: does NOT create new wrapper frame",
  );
  assertNotContains(
    code,
    "figma.createSection()",
    "appendToId: does NOT create section",
  );
  assertNotContains(
    code,
    "sectionId",
    "appendToId: return value has no sectionId",
  );
})();

section("generateCallCode: counter reset between calls");

(function testCounterResetsOnCallCode() {
  const code1 = cg.generateCallCode(MINIMAL_SPEC);
  const code2 = cg.generateCallCode(MINIMAL_SPEC);
  // Both calls should produce identical var names (counter resets each time)
  assert(
    code1 === code2,
    "generateCallCode: resets counter, produces identical output on repeat call",
  );
})();

// ---------------------------------------------------------------------------
// Tests: String escaping
// ---------------------------------------------------------------------------

section("String escaping");

(function testApostropheInNames() {
  const code = cg.genFills("node", ["#FF0000"]);
  // The generated code uses single quotes — no apostrophe issue in hex
  // But test a name with apostrophe
  cg.resetCounter();
  const frameCode = cg.generateNodeCode(
    {
      type: "FRAME",
      name: "Designer's Frame",
    },
    "f",
  );
  assertContains(
    frameCode,
    "Designer\\'s Frame",
    "Escaping: apostrophe in frame name is escaped",
  );
})();

(function testBackslashInContent() {
  cg.resetCounter();
  const textCode = cg.generateNodeCode(
    {
      type: "TEXT",
      content: "path\\to\\file",
    },
    "t",
  );
  assertContains(
    textCode,
    "path\\\\to\\\\file",
    "Escaping: backslashes in content are doubled",
  );
})();

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

process.stdout.write("\n" + "─".repeat(50) + "\n");
process.stdout.write("Results: " + passed + " passed, " + failed + " failed\n");

if (failures.length) {
  process.stdout.write("\nFailed tests:\n");
  failures.forEach((f) => process.stdout.write("  ✗ " + f + "\n"));
  process.exit(1);
} else {
  process.stdout.write("All tests passed!\n");
  process.exit(0);
}
