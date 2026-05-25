// Live markdown preview pane.
//
// Uses react-markdown + remark-gfm (tables, task lists) + rehype-slug
// (auto-id headings from text). Typography lives in base.css under
// .md-prose — keep classnames in sync.

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";

export interface PreviewProps {
  text: string;
}

export function Preview({ text }: PreviewProps) {
  return (
    <div className="md-prose">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSlug]}>
        {text}
      </ReactMarkdown>
    </div>
  );
}
