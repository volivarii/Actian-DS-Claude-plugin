"use strict";
var test = require("node:test");
var assert = require("node:assert/strict");
var fs = require("fs");
var path = require("path");
var fm = require("../../scripts/lib/renderer.js").fmHtmlMap;
var ds = require("../../scripts/lib/renderer.js").dsHtmlMap;
var dsAnatomyMap = require("../../scripts/lib/renderer.js").dsAnatomyMap;
var unpublished = require("../helpers/unpublished.js");

var GOLDEN_DIR = path.join(__dirname, "__goldens__");
var UPDATE = process.env.UPDATE_GOLDENS === "1";
if (!fs.existsSync(GOLDEN_DIR)) fs.mkdirSync(GOLDEN_DIR, { recursive: true });

function golden(name, html) {
  var file = path.join(GOLDEN_DIR, name + ".html");
  if (UPDATE) {
    fs.writeFileSync(file, html);
    return;
  }
  assert.ok(
    fs.existsSync(file),
    "missing golden " + name + " (run UPDATE_GOLDENS=1)",
  );
  assert.equal(html, fs.readFileSync(file, "utf8"), "golden drift: " + name);
}

var FIXTURES = {
  fmButton: {
    ref: "fmButton",
    variant: "Type=Primary, Size=md",
    props: { Label: "Save" },
  },
  fmTextInput: {
    ref: "fmTextInput",
    props: { "Label Text": "Email", "Input Text": "you@co" },
  },
  fmCheckbox: {
    ref: "fmCheckbox",
    variant: "State=On",
    props: { Label: "Agree" },
  },
  fmAlert: {
    ref: "fmAlert",
    variant: "Type=Warning",
    props: { Message: "Heads up" },
  },
  fmBadge: { ref: "fmBadge", props: { Label: "New" } },
  fmTabs: {
    ref: "fmTabs",
    props: { Tabs: "Overview, Details", Active: "Overview" },
  },
  fmMenu: { ref: "fmMenu", props: { Items: "Edit, Delete" } },
  fmNavBar: { ref: "fmNavBar", props: { Items: "Home, Reports" } },
  fmUser: { ref: "fmUser", props: { Name: "Ada Lovelace" } },
  fmMultiSelectMenuItem: {
    ref: "fmMultiSelectMenuItem",
    variant: "State=Selected",
    props: { Label: "Option" },
  },
  iconFallback: { ref: "fmAcademicCap", name: "Academic cap" },
  // Prop-key-drift regression guards (the fm-html-map case must render real
  // content, not just exist). fmStepper: numbered + labelled wizard step.
  fmStepperActive: {
    ref: "fmStepper",
    variant: "State=Active",
    props: { Label: "Choose connector", "Step number": "1" },
  },
  fmStepperUpcoming: {
    ref: "fmStepper",
    variant: "State=Upcoming",
    props: { Label: "Review", "Step number": "5" },
  },
  // #id-suffixed prop keys (as the Figma push consumes them) must resolve in
  // HTML too — guards normalizeProps() suffix-stripping.
  fmButtonSuffixedProps: {
    ref: "fmButton",
    variant: "Type=Outline, Size=md",
    props: { "Label#1411:32": "Cancel", "👁 Leading Icon#1410:3": false },
  },
  // Multi-column header row authored as one fmTableCell with numbered Labels.
  fmTableCellHeaderRow: {
    ref: "fmTableCell",
    variant: "Type=Header",
    props: { Label: "Name", "Label 2": "Type", "Label 3": "Status" },
  },
};

Object.keys(FIXTURES).forEach(function (name) {
  test("golden: " + name, function () {
    var node = Object.assign({ type: "INSTANCE" }, FIXTURES[name]);
    golden("component-" + name, fm.renderFMComponent(node));
  });
});

// Hi-fi DS tier goldens (Phase 0 scope: button, input, checkbox).
// Each fixture is a library:"ds" INSTANCE; renderDSComponent switches on dsSlug.
var DS_FIXTURES = {
  buttonPrimary: {
    dsSlug: "button",
    variant: "Type=Primary, Size=Default",
    props: { Label: "Save" },
  },
  buttonSecondary: {
    dsSlug: "button",
    variant: "Type=Secondary, Size=Default",
    props: { Label: "Cancel" },
  },
  buttonTertiary: {
    dsSlug: "button",
    variant: "Type=Tertiary, Size=Default",
    props: { Label: "Skip" },
  },
  buttonCritical: {
    dsSlug: "button",
    variant: "Type=Critical primary, Size=Default",
    props: { Label: "Delete" },
  },
  buttonDisabled: {
    dsSlug: "button",
    variant: "Type=Primary, Size=Default, State=Disabled",
    props: { Label: "Save" },
  },
  buttonSmall: {
    dsSlug: "button",
    variant: "Type=Primary, Size=Small",
    props: { Label: "Go" },
  },
  buttonWithIcons: {
    dsSlug: "button",
    variant: "Type=Primary, Size=Default",
    props: {
      Label: "Add",
      "Leading icon show": true,
      "Trailing icon show": true,
    },
  },
  inputDefault: {
    dsSlug: "text-input",
    variant: "States=Default",
    props: { Label: "Email", "Placeholder text": "you@co" },
  },
  inputTrailingIcon: {
    dsSlug: "text-input",
    variant: "States=Default",
    props: {
      Label: "Date",
      "Placeholder text": "Select a date",
      "Trailing icon": "chevron",
    },
  },
  inputDisabled: {
    dsSlug: "text-input",
    variant: "States=Disabled",
    props: { Label: "Email", "Placeholder text": "you@co" },
  },
  checkboxOff: {
    dsSlug: "checkbox",
    variant: "Selected=No",
    props: { Label: "Agree to terms" },
  },
  checkboxOn: {
    dsSlug: "checkbox",
    variant: "Selection=Checked",
    props: { Label: "Agree to terms" },
  },
  checkboxDisabled: {
    dsSlug: "checkbox",
    variant: "Selected=No, State=Disabled",
    props: { Label: "Agree to terms" },
  },
  // Catalog-slice content components.
  // The Color axis was retired on 2026-08-12 for a 14-value Type
  // axis. Left as "Color=Default" these two kept rendering, because the leaf
  // shape-clamps an unknown axis rather than throwing: the pill came out with
  // NO modifier class at all and the golden would have gone on recording that
  // as if it were the component. Both now name live Type values.
  tagDefault: {
    dsSlug: "read-only-tag",
    variant: "Type=Default",
    props: { Label: "Active" },
  },
  // Still the icon-bearing counterpart, but the icon is no longer opted into:
  // `Leading icon show` is a default-TRUE registry boolean, so passing it
  // explicitly proved nothing the default did not already do. Type=Catalog is
  // what carries a fact now, because the leaf swaps the GLYPH per Type
  // (folder here, `add` for tagDefault above), so the pair pins the swap.
  tagWithIcon: {
    dsSlug: "read-only-tag",
    variant: "Type=Catalog",
    props: { Label: "Catalog" },
  },
  badgeNumber: {
    dsSlug: "badge",
    variant: "Type=Number",
    props: { Label: "3" },
  },
  badgeDot: {
    dsSlug: "badge",
    variant: "Type=Dot",
    props: {},
  },
  searchDefault: {
    dsSlug: "search",
    variant: "State=Default",
    props: { "Placeholder text": "Search catalog" },
  },
  searchDisabled: {
    dsSlug: "search",
    variant: "State=Disabled",
    props: { "Placeholder text": "Search catalog" },
  },
  // Catalog-slice chrome components.
  globalHeaderStudio: {
    dsSlug: "global-header",
    variant: "App type=Studio, Breakpoints=XL",
    props: {},
  },
  sideNavExpanded: {
    dsSlug: "side-nav",
    variant: "App=Studio, View=Expanded",
    props: {
      Items: "Catalog, Pipelines, Connections, Settings",
      Active: "Catalog",
    },
  },
  sideNavCollapsed: {
    dsSlug: "side-nav",
    variant: "App=Studio, View=Collapsed",
    props: {
      Items: "Catalog, Pipelines, Connections, Settings",
      Active: "Catalog",
    },
  },
  // Task 3: real Studio grouped sidebar (top group + bottom group + collapse).
  sideNavGrouped: {
    dsSlug: "side-nav",
    variant: "App=Studio, View=Expanded",
    props: {
      Groups: JSON.stringify([
        {
          items: [
            { label: "Dashboard", icon: "dashboard" },
            { label: "Catalog", icon: "catalog" },
            { label: "Topics", icon: "more" },
          ],
        },
        {
          items: [
            { label: "Access request", icon: "user-single" },
            { label: "Catalog design", icon: "edit" },
            { label: "Analytics", icon: "dashboard" },
          ],
        },
      ]),
      Active: "Catalog",
    },
  },
  // P1b chrome leaves.
  pageHeaderDefault: {
    dsSlug: "page-header",
    variant: "Type=Default",
    props: { Title: "Data Catalog", Description: "Browse and manage datasets" },
  },
  breadcrumbsPath: {
    dsSlug: "breadcrumb",
    variant: "Type=Default",
    props: { Items: "Catalog, Datasets, Orders" },
  },
  tabsRow: {
    dsSlug: "tabs",
    variant: "Property 1=Default",
    props: { Items: "Overview, Schema, Lineage", Active: "Schema" },
  },
  // P1c forms — toggle (the first leaf built via the Dev Mode + knowledge + LLM
  // engine; vector component, so Dev Mode flattened it — geometry came from the
  // media oracle + judgment, not extraction).
  toggleOff: {
    dsSlug: "toggle",
    variant: "Toggle location=Left, Selected=No, State=Default",
    props: { Label: "Email notifications" },
  },
  toggleOn: {
    dsSlug: "toggle",
    variant: "Toggle location=Left, Selection=On, State=Default",
    props: { Label: "Email notifications" },
  },
  toggleRightWithHelper: {
    dsSlug: "toggle",
    variant: "Toggle location=Right, Selection=On, State=Default",
    props: { Label: "Auto-sync", "Helper text": "Sync every 5 minutes" },
  },
  toggleDisabled: {
    dsSlug: "toggle",
    variant: "Toggle location=Left, Selected=No, State=Disabled",
    props: { Label: "Email notifications" },
  },
  // P1c forms — radio-button (sibling of checkbox; built from the checkbox
  // structure + the media oracle, Default + Card formats).
  radioOff: {
    dsSlug: "radio",
    variant: "Format=Default, Selected=No, State=Default",
    props: { Label: "Standard plan" },
  },
  radioOn: {
    dsSlug: "radio",
    variant: "Format=Default, Selection=Selected, State=Default",
    props: { Label: "Standard plan", "Helper text": "Best for small teams" },
  },
  radioCard: {
    dsSlug: "radio",
    variant: "Format=Card format, Selection=Selected, State=Default",
    props: { Label: "Premium", "Helper text": "Advanced features" },
  },
  radioDisabled: {
    dsSlug: "radio",
    variant: "Format=Default, Selected=No, State=Disabled",
    props: { Label: "Standard plan" },
  },
  // Task 9 — table leaf (content data grid)
  tableDefault: {
    dsSlug: "table",
    variant: "",
    props: {
      Columns: "Name, Status, Owner",
      Rows: [
        ["Orders", "Active", "M. Chen"],
        ["Returns", "Draft", "A. Roy"],
        ["Shipments", "Active", "K. Patel"],
      ],
    },
  },
  // Task 9b — modal leaf
  modalDefault: {
    dsSlug: "modal",
    variant: "Size & Type=700px setting",
    props: {
      Title: "Confirm deletion",
      Body: "This action cannot be undone. All associated data will be permanently removed.",
      Actions: [
        { label: "Delete", variant: "primary" },
        { label: "Cancel", variant: "secondary" },
      ],
    },
  },
  // Task 9b — empty-state leaf
  emptyStateWithCta: {
    dsSlug: "empty-state",
    variant: "Size=Large",
    props: {
      Headline: "No policies available",
      Body: "Create policies to define how your platform operates.",
      Cta: "Create policy",
    },
  },
  emptyStateNoCta: {
    dsSlug: "empty-state",
    variant: "Size=Medium",
    props: {
      Headline: "No results found",
      Body: "Try adjusting your filters or search terms.",
    },
  },
  // Task 9b — alert-banner leaf
  alertBannerWarning: {
    dsSlug: "alert-banner",
    variant: "Type=Warning",
    props: {
      Title: "Scheduled maintenance",
      Message: "The system will be unavailable from 2:00 AM to 4:00 AM UTC.",
    },
  },
  alertBannerDanger: {
    dsSlug: "alert-banner",
    variant: "Type=Danger",
    props: {
      Message: "A critical error occurred. Please contact support.",
    },
  },
  alertBannerSuccess: {
    dsSlug: "alert-banner",
    variant: "Type=Success",
    props: {
      Message: "Your changes have been saved successfully.",
    },
  },
  alertBannerPrimary: {
    dsSlug: "alert-banner",
    variant: "Type=Primary",
    props: {
      Title: "New features available",
      Message: "Check out the latest updates in the release notes.",
    },
  },
  // Task 11 — chat-with-ai-steward leaf
  stewardAnswered: {
    dsSlug: "chat-with-ai-steward",
    variant: "State=Answered",
    props: {
      Title: "AI Steward",
      Insight:
        "Orders joins cleanly to Customers on customer_id. The foreign key is enforced and the join selectivity is high.",
      Source: "Sales catalog",
      Confidence: "High",
    },
  },
  stewardGenerating: {
    dsSlug: "chat-with-ai-steward",
    variant: "State=Generating",
    props: {},
  },
  // Task 4 — full Figma anatomy re-model (Welcome state + Drawer size)
  stewardWelcome: {
    dsSlug: "chat-with-ai-steward",
    props: {
      Title: "Data Steward",
      State: "Welcome",
      Greeting:
        "Welcome Vincent! I'm your Data Steward Agent. I can help you explore your catalog.",
      Context: { type: "Dataset", name: "/why_not/table" },
    },
  },
  stewardDocked: {
    dsSlug: "chat-with-ai-steward",
    variant: "size=Drawer",
    props: {
      Title: "Data Steward",
      State: "Answered",
      Insight: "Orders joins cleanly to Customers on customer_id.",
      Source: "Sales catalog",
      Confidence: "High",
    },
  },
  // The tag-status COMPONENT was deleted on 2026-08-12 and folded into
  // read-only-tag's Type axis, so these two are repointed onto their successor
  // values (Status=Success -> Type=Status-success, Status=Fail ->
  // Type=Status-error, which is what Figma now calls the failure value).
  //
  // Left alone they would not have errored: the slug simply stops resolving,
  // buildDsAnatomyDocMap returns {} and renderDSComponent falls to
  // gracefulChip(), so the goldens would have quietly re-baselined onto a bare
  // <span class="ds-component"> chip. That is why the fixtures move rather than
  // the golden files being regenerated.
  //
  // ✅ THE MISSING-ICON DEFECT THE OLD NOTE HERE TRACKED IS FIXED, and these
  // goldens now record the icons. The previous note said knowledge rendered
  // these label-only because the 2026-07 icon rework deleted `checkmark-outline`
  // (Success) and `misuse-outline` (Fail), and it asked for a re-baseline WITH
  // the icon once glyphs existed. The fold-in supplied different, live glyphs
  // (`success-filled` and `error-filled`) via the leaf's per-Type icon map, so
  // both pills now carry real path geometry. knowledge #406 covers the six
  // dropped glyphs generally and stays open; it no longer blocks these two.
  tagStatusSuccess: {
    dsSlug: "read-only-tag",
    variant: "Type=Status-success",
    props: { Label: "Active" },
  },
  tagStatusFail: {
    dsSlug: "read-only-tag",
    variant: "Type=Status-error",
    props: { Label: "Failed" },
  },
};

// dsSlugs handled by an explicit switch case in ds-html-map.js render without
// any anatomy doc map (the fixtures above only use those). A fixture whose
// dsSlug is NOT in BUILT_SLUGS falls to the default: seam, which renders from
// the captured appearance doc ONLY when one is injected via
// setAnatomyDocMap() — so those fixtures get the REAL vendored doc map
// injected for the duration of their test (reset after), mirroring
// ds-default-appearance.test.js's before/try-finally/after pattern.
var DS_BUILT_SLUGS_SET = {};
(ds.BUILT_SLUGS || []).forEach(function (slug) {
  DS_BUILT_SLUGS_SET[slug] = true;
});

Object.keys(DS_FIXTURES).forEach(function (name) {
  var fixture = DS_FIXTURES[name];
  // A fixture whose component is unpublished upstream keeps its golden file
  // on disk and skips, so the capture is still here when the component comes
  // back. Read from the fixture own dsSlug rather than listing fixture names,
  // so a second quarantined component needs no edit here.
  var opts = { skip: unpublished.skipReason(fixture.dsSlug) };
  test("golden(ds): " + name, opts, function () {
    var node = Object.assign({ type: "INSTANCE", library: "ds" }, fixture);
    var needsDocMap = !DS_BUILT_SLUGS_SET[fixture.dsSlug];
    if (needsDocMap) {
      ds.setAnatomyDocMap(dsAnatomyMap.buildDsAnatomyDocMap([fixture.dsSlug]));
    }
    try {
      golden("ds-" + name, ds.renderDSComponent(node));
    } finally {
      if (needsDocMap) ds.setAnatomyDocMap(null);
    }
  });
});

var renderNode;
try {
  renderNode = require("../../scripts/renderers/html-renderers/render-node.js");
} catch (e) {
  renderNode = null;
}

var STRUCT_FIXTURES = {
  frameRow: {
    type: "FRAME",
    layout: { mode: "HORIZONTAL" },
    children: [
      { type: "TEXT", content: "A", width: 80 },
      { type: "TEXT", content: "B" },
    ],
  },
  textClamped: {
    type: "TEXT",
    content: "A very long label that should clamp",
    width: 100,
  },
  textUpper: { type: "TEXT", content: "header", textCase: "UPPER" },
  textMetrics: {
    type: "TEXT",
    content: "Metrics",
    font: "Inter:Regular",
    size: 14,
    lineHeight: { value: 20, unit: "PIXELS" },
    letterSpacing: { value: 0.5, unit: "PIXELS" },
  },
  textDefaultFont: { type: "TEXT", content: "Defaulted", font: ":Bold" },
  rectFallback: { type: "RECT" },
  ellipseFallback: { type: "ELLIPSE" },
  divider: { type: "DIVIDER" },
  frameJustified: {
    type: "FRAME",
    layout: {
      mode: "HORIZONTAL",
      primaryAxisAlignItems: "SPACE_BETWEEN",
      counterAxisAlignItems: "CENTER",
    },
    children: [
      { type: "TEXT", content: "L" },
      { type: "TEXT", content: "R" },
    ],
  },
  framePadded: {
    type: "FRAME",
    layout: { mode: "VERTICAL", padding: [12, 8, 4, 16] },
    children: [{ type: "TEXT", content: "x" }],
  },
};
Object.keys(STRUCT_FIXTURES).forEach(function (name) {
  test("golden(struct/inter): " + name, function () {
    assert.ok(renderNode, "render-node.js must exist");
    golden(
      "struct-inter-" + name,
      renderNode.renderNode(STRUCT_FIXTURES[name], { defaultFont: "Inter" }),
    );
  });
  test("golden(struct/roboto): " + name, function () {
    assert.ok(renderNode, "render-node.js must exist");
    golden(
      "struct-roboto-" + name,
      renderNode.renderNode(STRUCT_FIXTURES[name], { defaultFont: "Roboto" }),
    );
  });
});
