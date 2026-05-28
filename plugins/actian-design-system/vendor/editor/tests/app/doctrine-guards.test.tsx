import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import "../setup-dom";
import { render, cleanup } from "@testing-library/react";
import { Theme } from "@radix-ui/themes";
import React from "react";
import { SectionInspector } from "../../src/app/SectionInspector";
import { TopicPicker } from "../../src/app/TopicPicker";
import type {
  OutgoingConnection,
  Taxonomy,
  SearchResult,
} from "../../src/substrate";

afterEach(cleanup);

const FORBIDDEN_TOKENS = [
  "slug",
  "ref:",
  "a11y_refs",
  "motion_refs",
  "frontmatter",
];

const fakeTaxonomy: Taxonomy = {
  getSlugs: () => [],
  getTitle: (_d, s) => ({ "color-contrast": "Color contrast" })[s] ?? null,
  getBody: () => null,
  domainOfSlug: () => "accessibility",
  searchSections: () => [
    {
      slug: "color-contrast",
      domain: "accessibility",
      title: "Color contrast",
      body: "WCAG 1.4.3",
    } as SearchResult,
  ],
};

function gatherText(container: HTMLElement): string {
  return container.textContent ?? "";
}

test("doctrine: SectionInspector renders no forbidden vocabulary", () => {
  const outgoing: OutgoingConnection[] = [
    {
      slug: "color-contrast",
      refType: "a11y_refs",
      note: null,
      domain: "accessibility",
    },
  ];
  const { container } = render(
    <Theme>
      <SectionInspector
        sectionTitle="§3.1"
        outgoing={outgoing}
        incoming={[]}
        taxonomy={fakeTaxonomy}
        scope="file"
        onAddConnection={() => {}}
        onRemoveConnection={() => {}}
        onRepointConnection={() => {}}
      />
    </Theme>,
  );
  const text = gatherText(container).toLowerCase();
  for (const token of FORBIDDEN_TOKENS) {
    assert.equal(
      text.includes(token.toLowerCase()),
      false,
      `forbidden token "${token}" appeared in SectionInspector rendered text — author-facing UI must use "topic" / "connection" / "identifier"`,
    );
  }
});

test("doctrine: TopicPicker renders no forbidden vocabulary", () => {
  const { container } = render(
    <Theme>
      <TopicPicker
        taxonomy={fakeTaxonomy}
        onPick={() => {}}
        onCancel={() => {}}
      />
    </Theme>,
  );
  const text = gatherText(container).toLowerCase();
  for (const token of FORBIDDEN_TOKENS) {
    assert.equal(
      text.includes(token.toLowerCase()),
      false,
      `forbidden token "${token}" appeared in TopicPicker rendered text — author-facing UI must use "topic" / "connection" / "identifier"`,
    );
  }
});

test("doctrine: SectionInspector does not leak frontmatter into body container (no shared classnames)", () => {
  const outgoing: OutgoingConnection[] = [
    {
      slug: "color-contrast",
      refType: "a11y_refs",
      note: "guarded test",
      domain: "accessibility",
    },
  ];
  const { container } = render(
    <Theme>
      <SectionInspector
        sectionTitle="§3.1"
        outgoing={outgoing}
        incoming={[]}
        taxonomy={fakeTaxonomy}
        scope="file"
        onAddConnection={() => {}}
        onRemoveConnection={() => {}}
        onRepointConnection={() => {}}
      />
    </Theme>,
  );
  const leaks = container.querySelectorAll("[data-connection], [data-ref]");
  assert.equal(
    leaks.length,
    0,
    "Section Inspector must not stamp inline connection metadata onto rendered DOM",
  );
});
