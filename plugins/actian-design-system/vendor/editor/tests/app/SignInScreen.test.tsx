import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import "../setup-dom";
import {
  render,
  screen,
  fireEvent,
  cleanup,
} from "@testing-library/react";
import { Theme } from "@radix-ui/themes";
import React from "react";
import { SignInScreen } from "../../src/app/SignInScreen";

afterEach(() => cleanup());

function wrap(node: React.ReactNode) {
  return <Theme>{node}</Theme>;
}

test("SignInScreen: renders primary GitHub button", () => {
  render(wrap(<SignInScreen onOAuthSignIn={async () => {}} onPATSignIn={() => {}} />));
  assert.ok(screen.getByRole("button", { name: /sign in with github/i }));
});

test("SignInScreen: clicking GitHub button invokes onOAuthSignIn", async () => {
  let called = 0;
  render(
    wrap(
      <SignInScreen
        onOAuthSignIn={async () => {
          called++;
        }}
        onPATSignIn={() => {}}
      />,
    ),
  );
  fireEvent.click(screen.getByRole("button", { name: /sign in with github/i }));
  await new Promise((r) => setTimeout(r, 10));
  assert.equal(called, 1);
});

test("SignInScreen: PAT panel is collapsed by default", () => {
  render(wrap(<SignInScreen onOAuthSignIn={async () => {}} onPATSignIn={() => {}} />));
  // PAT input is NOT in the document when collapsed
  assert.equal(screen.queryByPlaceholderText(/personal access token/i), null);
});

test("SignInScreen: clicking the PAT disclosure expands the input", () => {
  render(wrap(<SignInScreen onOAuthSignIn={async () => {}} onPATSignIn={() => {}} />));
  fireEvent.click(screen.getByText(/use a personal access token/i));
  assert.ok(screen.getByPlaceholderText(/personal access token/i));
});

test("SignInScreen: submitting PAT invokes onPATSignIn", () => {
  let received = "";
  render(
    wrap(
      <SignInScreen
        onOAuthSignIn={async () => {}}
        onPATSignIn={(pat) => {
          received = pat;
        }}
      />,
    ),
  );
  fireEvent.click(screen.getByText(/use a personal access token/i));
  const input = screen.getByPlaceholderText(/personal access token/i);
  fireEvent.change(input, { target: { value: "ghp_xyz" } });
  fireEvent.click(screen.getByRole("button", { name: /save token/i }));
  assert.equal(received, "ghp_xyz");
});

test("SignInScreen: shows error when onOAuthSignIn throws", async () => {
  render(
    wrap(
      <SignInScreen
        onOAuthSignIn={async () => {
          throw new Error("Popup blocked");
        }}
        onPATSignIn={() => {}}
      />,
    ),
  );
  fireEvent.click(screen.getByRole("button", { name: /sign in with github/i }));
  await new Promise((r) => setTimeout(r, 50));
  assert.ok(screen.getByText(/popup blocked/i));
});
