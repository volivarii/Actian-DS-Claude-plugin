// Shared singletons — App, EditorShell, and MarkdownEditScreen
// must all reference the SAME instances so subscribe/emit events propagate.

import { DraftStore } from "./DraftStore";
import { SubmissionCart } from "./SubmissionCart";

const storage =
  typeof window !== "undefined"
    ? window.localStorage
    : (null as unknown as Storage);

export const draftStoreSingleton = new DraftStore(storage);
export const submissionCartSingleton = new SubmissionCart(storage);
