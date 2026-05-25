import { test } from "node:test";
import assert from "node:assert/strict";
import "../setup-dom";
import { render } from "@testing-library/react";
import { Preview } from "../../src/markdown-engine/Preview";

test("Preview: renders headings", () => {
  const { container } = render(<Preview text={"# Hello\n\n## World"} />);
  assert.equal(container.querySelector("h1")?.textContent, "Hello");
  assert.equal(container.querySelector("h2")?.textContent, "World");
});

test("Preview: renders GFM tables", () => {
  const { container } = render(
    <Preview text={"| A | B |\n|---|---|\n| 1 | 2 |\n"} />,
  );
  assert.ok(container.querySelector("table"));
  assert.equal(container.querySelectorAll("td").length, 2);
});

test("Preview: rehype-slug assigns heading ids", () => {
  const { container } = render(<Preview text="## Color Tokens" />);
  const h2 = container.querySelector("h2");
  assert.equal(h2?.id, "color-tokens");
});

test("Preview: renders lists", () => {
  const { container } = render(<Preview text={"- one\n- two\n"} />);
  assert.equal(container.querySelectorAll("li").length, 2);
});

test("Preview: renders inline code", () => {
  const { container } = render(<Preview text="Use `foo` here." />);
  assert.equal(container.querySelector("code")?.textContent, "foo");
});

test("Preview: empty text renders empty", () => {
  const { container } = render(<Preview text="" />);
  assert.equal(container.children.length, 1);
  assert.equal(container.firstElementChild?.children.length, 0);
});
