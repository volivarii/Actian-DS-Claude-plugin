#!/usr/bin/env node
"use strict";

/**
 * fm-html-map.test.js — Tests for fm-html-map.js
 *
 * Run with: node tests/fm-html-map.test.js
 * (from the plugins/actian-design-system directory)
 */

const path = require("path");
const { renderFMComponent, parseVariant } = require(
  path.join(__dirname, "../../scripts/renderers/html-renderers/fm-html-map.js"),
);

// ---------------------------------------------------------------------------
// Minimal test harness
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, message) {
  if (condition) {
    passed++;
    process.stdout.write("  \u2713 " + message + "\n");
  } else {
    failed++;
    failures.push(message);
    process.stdout.write("  \u2717 FAIL: " + message + "\n");
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
// parseVariant
// ---------------------------------------------------------------------------

section("parseVariant");

const pv = parseVariant("Type=Primary, Size=md, State=Default");
assert(pv.Type === "Primary", "Type=Primary");
assert(pv.Size === "md", "Size=md");
assert(pv.State === "Default", "State=Default");

const pvEmpty = parseVariant("");
assert(
  typeof pvEmpty === "object" && Object.keys(pvEmpty).length === 0,
  "empty string returns {}",
);

const pvNull = parseVariant(null);
assert(
  typeof pvNull === "object" && Object.keys(pvNull).length === 0,
  "null returns {}",
);

const pvSingle = parseVariant("Type=Outline");
assert(pvSingle.Type === "Outline", "single pair parsed");

// ---------------------------------------------------------------------------
// fmButton
// ---------------------------------------------------------------------------

section("fmButton");

const btnPrimary = renderFMComponent({
  type: "INSTANCE",
  ref: "fmButton",
  variant: "Type=Primary, Size=md",
  props: { Label: "Save" },
});
assertContains(btnPrimary, "fm-button--primary", "primary type class");
assertContains(btnPrimary, "fm-button--md", "md size class");
assertContains(btnPrimary, "Save", "label text rendered");

const btnSecondary = renderFMComponent({
  type: "INSTANCE",
  ref: "fmButton",
  variant: "Type=Secondary, Size=sm",
  props: { Label: "Cancel" },
});
assertContains(btnSecondary, "fm-button--secondary", "secondary type class");
assertContains(btnSecondary, "fm-button--sm", "sm size class");
assertContains(btnSecondary, "Cancel", "cancel label");

const btnDestructive = renderFMComponent({
  type: "INSTANCE",
  ref: "fmButton",
  variant: "Type=Destructive, Size=md",
  props: { Label: "Delete" },
});
assertContains(btnDestructive, "fm-button--destructive", "destructive class");

const btnOutline = renderFMComponent({
  type: "INSTANCE",
  ref: "fmButton",
  variant: "Type=Outline, Size=sm",
  props: { Label: "Back" },
});
assertContains(btnOutline, "fm-button--outline", "outline class");

// ---------------------------------------------------------------------------
// fmTextInput
// ---------------------------------------------------------------------------

section("fmTextInput");

const tiDefault = renderFMComponent({
  type: "INSTANCE",
  ref: "fmTextInput",
  variant: "Type=Default",
  props: { "Input Text": "hello" },
});
assertContains(tiDefault, "fm-input--default", "default input type");
assertContains(tiDefault, "fm-input__text", "inner text span");
assertContains(tiDefault, "hello", "input text rendered");

const tiDisabled = renderFMComponent({
  type: "INSTANCE",
  ref: "fmTextInput",
  variant: "Type=Disabled",
  props: {},
});
assertContains(tiDisabled, "fm-input--disabled", "disabled input");

// ---------------------------------------------------------------------------
// fmDropdown
// ---------------------------------------------------------------------------

section("fmDropdown");

const ddFilled = renderFMComponent({
  type: "INSTANCE",
  ref: "fmDropdown",
  variant: "Type=Filled",
  props: { "Dropdown Text": "Option A" },
});
assertContains(ddFilled, "fm-dropdown--filled", "filled dropdown");
assertContains(ddFilled, "fm-dropdown__arrow", "arrow element");
assertContains(ddFilled, "Option A", "dropdown text");

const ddPlaceholder = renderFMComponent({
  type: "INSTANCE",
  ref: "fmDropdown",
  variant: "Type=Placeholder",
  props: {},
});
assertContains(
  ddPlaceholder,
  "fm-dropdown--placeholder",
  "placeholder dropdown",
);

// ---------------------------------------------------------------------------
// fmSearchInput
// ---------------------------------------------------------------------------

section("fmSearchInput");

const si = renderFMComponent({
  type: "INSTANCE",
  ref: "fmSearchInput",
  variant: "Type=Default",
  props: { "Input Text": "search..." },
});
assertContains(si, "fm-search-input", "search input base class");
assertContains(si, "search...", "search text");

// ---------------------------------------------------------------------------
// fmTextArea
// ---------------------------------------------------------------------------

section("fmTextArea");

const ta = renderFMComponent({
  type: "INSTANCE",
  ref: "fmTextArea",
  variant: "Content=Empty",
  props: {},
});
assertContains(ta, "fm-textarea", "textarea base class");
assertContains(ta, "fm-textarea--empty", "empty state class");

// ---------------------------------------------------------------------------
// fmCheckbox
// ---------------------------------------------------------------------------

section("fmCheckbox");

const cbOn = renderFMComponent({
  type: "INSTANCE",
  ref: "fmCheckbox",
  variant: "State=On",
  props: {},
});
assertContains(cbOn, "fm-checkbox--on", "checkbox on");

const cbOff = renderFMComponent({
  type: "INSTANCE",
  ref: "fmCheckbox",
  variant: "State=Off",
  props: {},
});
assertContains(cbOff, "fm-checkbox--off", "checkbox off");

// ---------------------------------------------------------------------------
// fmRadioButton
// ---------------------------------------------------------------------------

section("fmRadioButton");

const rbOn = renderFMComponent({
  type: "INSTANCE",
  ref: "fmRadioButton",
  variant: "State=On",
  props: {},
});
assertContains(rbOn, "fm-radio--on", "radio on");

const rbOff = renderFMComponent({
  type: "INSTANCE",
  ref: "fmRadioButton",
  variant: "State=Off",
  props: {},
});
assertContains(rbOff, "fm-radio--off", "radio off");

// ---------------------------------------------------------------------------
// fmToggle
// ---------------------------------------------------------------------------

section("fmToggle");

const tgOn = renderFMComponent({
  type: "INSTANCE",
  ref: "fmToggle",
  variant: "State=On",
  props: {},
});
assertContains(tgOn, "fm-toggle--on", "toggle on");

// ---------------------------------------------------------------------------
// fmAlert
// ---------------------------------------------------------------------------

section("fmAlert");

const alertSuccess = renderFMComponent({
  type: "INSTANCE",
  ref: "fmAlert",
  variant: "Type=Success",
  props: { Message: "Saved!" },
});
assertContains(alertSuccess, "fm-alert--success", "success alert");
assertContains(alertSuccess, "fm-alert__bar", "alert bar");
assertContains(alertSuccess, "fm-alert__content", "alert content");

const alertError = renderFMComponent({
  type: "INSTANCE",
  ref: "fmAlert",
  variant: "Type=Error",
  props: {},
});
assertContains(alertError, "fm-alert--error", "error alert");

// ---------------------------------------------------------------------------
// fmBanner
// ---------------------------------------------------------------------------

section("fmBanner");

const banner = renderFMComponent({
  type: "INSTANCE",
  ref: "fmBanner",
  variant: "",
  props: { Text: "Info banner" },
});
assertContains(banner, "fm-banner", "banner class");

// ---------------------------------------------------------------------------
// fmDialog
// ---------------------------------------------------------------------------

section("fmDialog");

const dialog = renderFMComponent({
  type: "INSTANCE",
  ref: "fmDialog",
  variant: "",
  props: {},
});
assertContains(dialog, "fm-dialog", "dialog class");
assertContains(dialog, "fm-dialog__title", "dialog title");
assertContains(dialog, "fm-dialog__body", "dialog body");

// ---------------------------------------------------------------------------
// fmStepper
// ---------------------------------------------------------------------------

section("fmStepper");

const stepActive = renderFMComponent({
  type: "INSTANCE",
  ref: "fmStepper",
  variant: "State=Active",
  props: { Step: "1" },
});
assertContains(stepActive, "fm-stepper--active", "active stepper");
assertContains(stepActive, "1", "step number");

const stepComplete = renderFMComponent({
  type: "INSTANCE",
  ref: "fmStepper",
  variant: "State=Complete",
  props: {},
});
assertContains(stepComplete, "fm-stepper--complete", "complete stepper");

// ---------------------------------------------------------------------------
// fmBadge
// ---------------------------------------------------------------------------

section("fmBadge");

const badgeMd = renderFMComponent({
  type: "INSTANCE",
  ref: "fmBadge",
  variant: "Size=Medium",
  props: { Label: "5" },
});
assertContains(badgeMd, "fm-badge--medium", "medium badge");
assertContains(badgeMd, "5", "badge text");

const badgeSm = renderFMComponent({
  type: "INSTANCE",
  ref: "fmBadge",
  variant: "Size=Small",
  props: {},
});
assertContains(badgeSm, "fm-badge--small", "small badge");

// ---------------------------------------------------------------------------
// fmTag
// ---------------------------------------------------------------------------

section("fmTag");

const tagFilled = renderFMComponent({
  type: "INSTANCE",
  ref: "fmTag",
  variant: "Style=Filled",
  props: { Label: "Active" },
});
assertContains(tagFilled, "fm-tag--filled", "filled tag");
assertContains(tagFilled, "Active", "tag text");

const tagOutline = renderFMComponent({
  type: "INSTANCE",
  ref: "fmTag",
  variant: "Style=Outline",
  props: {},
});
assertContains(tagOutline, "fm-tag--outline", "outline tag");

// ---------------------------------------------------------------------------
// fmChip
// ---------------------------------------------------------------------------

section("fmChip");

const chip = renderFMComponent({
  type: "INSTANCE",
  ref: "fmChip",
  variant: "",
  props: { Label: "Red" },
});
assertContains(chip, "fm-chip", "chip class");
assertContains(chip, "Red", "chip text");

// ---------------------------------------------------------------------------
// fmTab
// ---------------------------------------------------------------------------

section("fmTab");

const tabOn = renderFMComponent({
  type: "INSTANCE",
  ref: "fmTab",
  variant: "State=On",
  props: { Label: "Users" },
});
assertContains(tabOn, "fm-tab--on", "tab on");
assertContains(tabOn, "Users", "tab text");

// ---------------------------------------------------------------------------
// fmToast
// ---------------------------------------------------------------------------

section("fmToast");

const toastStd = renderFMComponent({
  type: "INSTANCE",
  ref: "fmToast",
  variant: "Style=Standard",
  props: { Message: "Done" },
});
assertContains(toastStd, "fm-toast--standard", "standard toast");

// ---------------------------------------------------------------------------
// fmEmptyState
// ---------------------------------------------------------------------------

section("fmEmptyState");

const empty = renderFMComponent({
  type: "INSTANCE",
  ref: "fmEmptyState",
  variant: "",
  props: {},
});
assertContains(empty, "fm-empty-state", "empty state class");
assertContains(empty, "fm-empty-state__icon", "icon element");
assertContains(empty, "No items", "default text");

// ---------------------------------------------------------------------------
// fmPlaceholder
// ---------------------------------------------------------------------------

section("fmPlaceholder");

const ph = renderFMComponent({
  type: "INSTANCE",
  ref: "fmPlaceholder",
  variant: "Type=Label+1line",
  props: {},
});
assertContains(ph, "fm-placeholder", "placeholder class");
assertContains(ph, "label+1line", "correct type variant");

// ---------------------------------------------------------------------------
// fmAppHeader
// ---------------------------------------------------------------------------

section("fmAppHeader");

const appHeaderAdmin = renderFMComponent({
  type: "INSTANCE",
  ref: "fmAppHeader",
  variant: "Type=Administration",
  props: {},
});
assertContains(appHeaderAdmin, "fm-app-header", "app header class");
assertContains(appHeaderAdmin, "Administration", "admin label");
assertContains(appHeaderAdmin, "fm-app-header__logo", "logo slot");
assertContains(appHeaderAdmin, "fm-app-header__avatar", "avatar slot");

const appHeaderStudio = renderFMComponent({
  type: "INSTANCE",
  ref: "fmAppHeader",
  variant: "Type=Studio",
  props: {},
});
assertContains(appHeaderStudio, "Studio", "studio label");

// ---------------------------------------------------------------------------
// fmNavItem
// ---------------------------------------------------------------------------

section("fmNavItem");

const navActive = renderFMComponent({
  type: "INSTANCE",
  ref: "fmNavItem",
  variant: "State=On",
  props: { Label: "Pipelines" },
});
assertContains(navActive, "fm-nav-item--active", "active nav item");
assertContains(navActive, "fm-nav-item__label", "label element");
assertContains(navActive, "Pipelines", "nav label text");

const navOff = renderFMComponent({
  type: "INSTANCE",
  ref: "fmNavItem",
  variant: "State=Off",
  props: { Label: "Jobs" },
});
assertContains(navOff, "fm-nav-item--off", "off state");

const navPlaceholder = renderFMComponent({
  type: "INSTANCE",
  ref: "fmNavItem",
  variant: "State=Placeholder",
  props: {},
});
assertContains(navPlaceholder, "fm-nav-item--placeholder", "placeholder state");
assertContains(navPlaceholder, "fm-nav-item__bar", "bar instead of label");
assertNotContains(
  navPlaceholder,
  "fm-nav-item__label",
  "no label element in placeholder",
);

// ---------------------------------------------------------------------------
// fmPageHeader
// ---------------------------------------------------------------------------

section("fmPageHeader");

const pgTitle = renderFMComponent({
  type: "INSTANCE",
  ref: "fmPageHeader",
  variant: "Type=title only",
  props: { Title: "My Page" },
});
assertContains(pgTitle, "fm-page-header", "page header class");
assertContains(pgTitle, "fm-page-header__title", "title element");
assertContains(pgTitle, "My Page", "title text");

const pgSubtitle = renderFMComponent({
  type: "INSTANCE",
  ref: "fmPageHeader",
  variant: "Type=title+subtitle",
  props: { Title: "Reports", Subtitle: "All time" },
});
assertContains(pgSubtitle, "fm-page-header__subtitle", "subtitle element");
assertContains(pgSubtitle, "All time", "subtitle text");

// ---------------------------------------------------------------------------
// fmIconButtons
// ---------------------------------------------------------------------------

section("fmIconButtons");

const iconBtn = renderFMComponent({
  type: "INSTANCE",
  ref: "fmIconButtons",
  variant: "Type=Primary",
  props: {},
});
assertContains(iconBtn, "fm-icon-button--primary", "primary icon button");

// ---------------------------------------------------------------------------
// fmSpinner
// ---------------------------------------------------------------------------

section("fmSpinner");

const spinner = renderFMComponent({
  type: "INSTANCE",
  ref: "fmSpinner",
  variant: "",
  props: {},
});
assertContains(spinner, "fm-spinner", "spinner class");

// ---------------------------------------------------------------------------
// fmProgressBar
// ---------------------------------------------------------------------------

section("fmProgressBar");

const progress = renderFMComponent({
  type: "INSTANCE",
  ref: "fmProgressBar",
  variant: "Completion=60%",
  props: {},
});
assertContains(progress, "fm-progress-bar", "progress bar class");
assertContains(progress, "fm-progress-bar__fill", "fill element");
assertContains(progress, "60%", "completion value");

// ---------------------------------------------------------------------------
// fmMultiSelectDropdown
// ---------------------------------------------------------------------------

section("fmMultiSelectDropdown");

const msdd = renderFMComponent({
  type: "INSTANCE",
  ref: "fmMultiSelectDropdown",
  variant: "",
  props: { "Dropdown Text": "Select..." },
});
assertContains(msdd, "fm-dropdown--multi", "multi dropdown class");
assertContains(msdd, "Select...", "dropdown text");

// ---------------------------------------------------------------------------
// fmMenuItem
// ---------------------------------------------------------------------------

section("fmMenuItem");

const menuDefault = renderFMComponent({
  type: "INSTANCE",
  ref: "fmMenuItem",
  variant: "State=Default",
  props: { Label: "Edit" },
});
assertContains(menuDefault, "fm-menu-item--default", "default menu item");
assertContains(menuDefault, "Edit", "menu item text");

const menuHover = renderFMComponent({
  type: "INSTANCE",
  ref: "fmMenuItem",
  variant: "State=Hover",
  props: {},
});
assertContains(menuHover, "fm-menu-item--hover", "hover menu item");

// ---------------------------------------------------------------------------
// fmTooltip
// ---------------------------------------------------------------------------

section("fmTooltip");

const tooltip = renderFMComponent({
  type: "INSTANCE",
  ref: "fmTooltip",
  variant: "",
  props: { Text: "More info" },
});
assertContains(tooltip, "fm-tooltip", "tooltip class");
assertContains(tooltip, "More info", "tooltip text");

// ---------------------------------------------------------------------------
// fmRichTextField
// ---------------------------------------------------------------------------

section("fmRichTextField");

const rtf = renderFMComponent({
  type: "INSTANCE",
  ref: "fmRichTextField",
  variant: "",
  props: { "Input Text": "Rich content" },
});
assertContains(rtf, "fm-textarea--rich", "rich text field class");
assertContains(rtf, "Rich content", "rtf text");

// ---------------------------------------------------------------------------
// fmSlider
// ---------------------------------------------------------------------------

section("fmSlider");

const slider = renderFMComponent({
  type: "INSTANCE",
  ref: "fmSlider",
  variant: "Progress=40%",
  props: {},
});
assertContains(slider, "fm-slider", "slider class");
assertContains(slider, "fm-slider__fill", "fill element");
assertContains(slider, "40%", "progress value");

// ---------------------------------------------------------------------------
// Unknown ref → generic placeholder
// ---------------------------------------------------------------------------

section("Unknown ref");

const unknown = renderFMComponent({
  type: "INSTANCE",
  ref: "fmUnknownWidget",
  variant: "",
  props: {},
  name: "Widget: Foo",
});
assertContains(unknown, "fm-component", "generic fallback class");
assertContains(unknown, 'data-ref="fmUnknownWidget"', "ref attribute");
assertNotContains(
  unknown,
  "[fmUnknownWidget]",
  "no raw [ref] box (graceful fallback)",
);
assertContains(unknown, "Widget: Foo", "renders the human name");

// ---------------------------------------------------------------------------
// New FM cases — fmTabs / fmUser / fmNavBar / fmMenu / fmMultiSelectMenuItem
// ---------------------------------------------------------------------------

section("fmTabs");

const tabs = renderFMComponent({
  type: "INSTANCE",
  ref: "fmTabs",
  props: { Tabs: "A, B", Active: "B" },
});
assertContains(tabs, "fm-tab--active", "active tab class");
assertContains(tabs, ">B<", "active tab label rendered");

section("fmUser");

const user = renderFMComponent({
  type: "INSTANCE",
  ref: "fmUser",
  props: { Name: "Ada Lovelace" },
});
assertContains(user, "AL", "initials rendered");
assertContains(user, "Ada Lovelace", "full name rendered");

section("fmNavBar / fmMenu / fmMultiSelectMenuItem");

["fmNavBar", "fmMenu", "fmMultiSelectMenuItem"].forEach(function (refName) {
  const elHtml = renderFMComponent({
    type: "INSTANCE",
    ref: refName,
    props: {},
  });
  assertNotContains(elHtml, "[" + refName + "]", refName + " no raw box");
  assert(elHtml.length > 0, refName + " renders non-empty html");
});

section("graceful default escaping");

const escapedDefault = renderFMComponent({
  type: "INSTANCE",
  ref: "fmSomethingNew",
  name: "Some <b>thing</b>",
});
assertNotContains(
  escapedDefault,
  "[fmSomethingNew]",
  "no raw [ref] in graceful default",
);
assertContains(escapedDefault, "&lt;b&gt;", "name is escaped");

// ---------------------------------------------------------------------------
// XSS safety
// ---------------------------------------------------------------------------

section("XSS safety");

const xssBtn = renderFMComponent({
  type: "INSTANCE",
  ref: "fmButton",
  variant: "Type=Primary, Size=md",
  props: { Label: "<script>alert(1)</script>" },
});
assertNotContains(xssBtn, "<script>", "script tag escaped in label");
assertContains(xssBtn, "&lt;script&gt;", "angle brackets escaped");

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

process.stdout.write("\n---\n");
process.stdout.write("Passed: " + passed + "  Failed: " + failed + "\n");

if (failures.length) {
  process.stdout.write("\nFailed tests:\n");
  failures.forEach(function (f) {
    process.stdout.write("  - " + f + "\n");
  });
  process.exit(1);
} else {
  process.stdout.write("All tests passed.\n");
  process.exit(0);
}
